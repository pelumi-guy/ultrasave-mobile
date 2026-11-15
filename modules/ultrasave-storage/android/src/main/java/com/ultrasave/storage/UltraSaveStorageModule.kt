package com.ultrasave.storage

import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.provider.Settings
import android.system.ErrnoException
import android.system.Os
import android.system.OsConstants
import android.webkit.MimeTypeMap
import android.media.MediaMetadataRetriever
import android.graphics.Bitmap
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileNotFoundException
import java.util.UUID
import java.security.MessageDigest

class UltraSaveStorageModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)
  private val resolver get() = context.contentResolver
  private val manager get() = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
  private val sources = setOf("WhatsApp", "X", "Instagram", "Threads", "TikTok", "YouTube")
  private val statusPaths = listOf(
    "Android/media/com.whatsapp/WhatsApp/Media/.Statuses",
    "WhatsApp/Media/.Statuses"
  )
  private val statusDirectories get() = statusPaths.map { File(Environment.getExternalStorageDirectory(), it) }

  override fun definition() = ModuleDefinition {
    Name("UltraSaveStorage")

    AsyncFunction("discoverStatuses") { tree: String? -> discoverStatuses(tree) }

    // "All files access" (Android 11+) is a settings toggle, not a runtime dialog.
    Function("allFilesAccess") {
      val supported = android.os.Build.VERSION.SDK_INT >= 30
      mapOf("supported" to supported, "granted" to (supported && Environment.isExternalStorageManager()))
    }

    AsyncFunction("openAllFilesAccessSettings") {
      require(android.os.Build.VERSION.SDK_INT >= 30) { "All files access is only needed on Android 11 or later" }
      val activity = appContext.currentActivity
      val specific = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:${context.packageName}"))
      val general = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
      for (intent in listOf(specific, general)) {
        try {
          if (activity != null) activity.startActivity(intent)
          else context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
          return@AsyncFunction Unit
        } catch (_: android.content.ActivityNotFoundException) {}
      }
      throw IllegalStateException("This phone does not expose the All files access setting. Use Connect WhatsApp Media folder instead.")
    }

    AsyncFunction("inspectStatuses") { tree: String ->
      val folder = statusFolder(document(tree))
      val items = folder?.let { statusItems(it) } ?: emptyList()
      mapOf("found" to (folder != null), "items" to items)
    }

    AsyncFunction("thumbnail") { source: String, modified: Double ->
      val uri = Uri.parse(source)
      require(uri.scheme == "content" || uri.scheme == "file") { "Expected local video" }
      val directory = File(context.cacheDir, "status-thumbnails").apply { mkdirs() }
      val key = MessageDigest.getInstance("SHA-256").digest("$source:$modified".toByteArray()).joinToString("") { "%02x".format(it) }
      val file = File(directory, "$key.jpg")
      if (file.exists()) return@AsyncFunction Uri.fromFile(file).toString()
      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(context, uri)
        val frame = if (android.os.Build.VERSION.SDK_INT >= 27) retriever.getScaledFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC, 320, 320) else retriever.getFrameAtTime(0)
        if (frame == null) return@AsyncFunction null
        file.outputStream().use { frame.compress(Bitmap.CompressFormat.JPEG, 75, it) }
        frame.recycle()
        directory.listFiles()?.sortedByDescending { it.lastModified() }?.drop(100)?.forEach { it.delete() }
        Uri.fromFile(file).toString()
      } catch (_: Exception) { null } finally { retriever.release() }
    }

    AsyncFunction("exportMedia") { sourceUri: String, tree: String?, source: String, name: String, mime: String ->
      require(source in sources) { "Unknown source" }
      require(mime.startsWith("image/") || mime.startsWith("video/")) { "Unsupported media type" }
      val filename = safeName(name)
      if (tree == null) exportPublic(sourceUri, source, filename, mime) else exportTree(sourceUri, tree, source, filename, mime)
    }

    AsyncFunction("probeDirectory") { tree: String ->
      val temporary = requireNotNull(DocumentsContract.createDocument(resolver, document(tree), "application/octet-stream", ".ultrasave-probe-${UUID.randomUUID()}"))
      try { requireNotNull(resolver.openOutputStream(temporary)).use { it.write(byteArrayOf(1)) } }
      finally { DocumentsContract.deleteDocument(resolver, temporary) }
      Unit
    }

    AsyncFunction("enqueue") { url: String, name: String, key: String ->
      val registry = context.getSharedPreferences("ultrasave-transfers", Context.MODE_PRIVATE)
      val previous = registry.getLong(key, -1L)
      if (previous != -1L) manager.query(DownloadManager.Query().setFilterById(previous)).use { cursor ->
        if (cursor != null && cursor.moveToFirst()) return@AsyncFunction previous.toString()
      }
      val uri = Uri.parse(url)
      val debug = context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
      require(uri.scheme == "https" || (debug && uri.scheme == "http")) { "HTTPS is required" }
      require(!uri.host.isNullOrEmpty() && uri.userInfo == null) { "Invalid media address" }
      val request = DownloadManager.Request(uri)
        .setTitle("UltraSave · ${safeName(name)}")
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
        .setAllowedOverMetered(true)
        .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, "${UUID.randomUUID()}-${safeName(name)}")
      val transferId = manager.enqueue(request)
      registry.edit().putLong(key, transferId).commit()
      transferId.toString()
    }

    AsyncFunction("transfer") { id: String ->
      manager.query(DownloadManager.Query().setFilterById(id.toLong())).use { cursor ->
        if (cursor == null || !cursor.moveToFirst()) return@AsyncFunction mapOf("state" to "missing", "bytes" to 0L, "total" to 0L)
        val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
        val state = when (status) {
          DownloadManager.STATUS_SUCCESSFUL -> "complete"
          DownloadManager.STATUS_FAILED -> "failed"
          DownloadManager.STATUS_PAUSED -> "paused"
          DownloadManager.STATUS_RUNNING -> "running"
          else -> "pending"
        }
        mapOf("state" to state,
          "bytes" to cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)),
          "total" to cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)),
          "reason" to cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)),
          "uri" to cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI)))
      }
    }

    AsyncFunction("removeTransfer") { id: String -> manager.remove(id.toLong()); Unit }
  }

  private fun discoverStatuses(tree: String?): Map<String, Any> {
    var needsAccess = false
    var initialUri = mediaTree(0).toString()
    if (tree != null) {
      try {
        val folder = statusFolder(document(tree))
        if (folder != null) return statusResult("ready", statusItems(folder), tree)
      } catch (_: Exception) { needsAccess = true }
    }

    // Reuse existing grants even if the app's saved folder preference was lost.
    // A candidate must be inside the tree Android actually granted to this app.
    val grants = resolver.persistedUriPermissions.filter { it.isReadPermission }
    for ((index, path) in statusPaths.withIndex()) {
      val id = "primary:$path"
      for (grant in grants) {
        if (grant.uri.authority != "com.android.externalstorage.documents" || !DocumentsContract.isTreeUri(grant.uri)) continue
        val rootId = DocumentsContract.getTreeDocumentId(grant.uri).trimEnd('/')
        if (id != rootId && !id.startsWith(if (rootId.endsWith(':')) rootId else "$rootId/")) continue
        try {
          val folder = DocumentsContract.buildDocumentUriUsingTree(grant.uri, id)
          if (metadata(folder)?.get("mime") == DocumentsContract.Document.MIME_TYPE_DIR) {
            return statusResult("ready", statusItems(folder), mediaTree(index).toString())
          }
        } catch (_: Exception) { needsAccess = true }
      }
    }

    for ((index, directory) in statusDirectories.withIndex()) {
      try {
        val stat = Os.stat(directory.path)
        if (!OsConstants.S_ISDIR(stat.st_mode)) continue
        val files = directory.listFiles()
        if (files == null) {
          needsAccess = true
          initialUri = mediaTree(index).toString()
          continue
        }
        val supported = files.filter {
          val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(it.extension.lowercase()) ?: ""
          mime.startsWith("image/") || mime.startsWith("video/")
        }
        if (supported.any { !it.canRead() }) {
          needsAccess = true
          initialUri = mediaTree(index).toString()
          continue
        }
        val items = supported.filter { it.isFile && it.canonicalFile.parentFile == directory.canonicalFile }
          .mapNotNull { file ->
            val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(file.extension.lowercase()) ?: return@mapNotNull null
            if (!mime.startsWith("image/") && !mime.startsWith("video/")) return@mapNotNull null
            val uri = Uri.fromFile(file).toString()
            mapOf("id" to uri, "uri" to uri, "name" to file.name, "mime" to mime,
              "kind" to if (mime.startsWith("video/")) "video" else "image",
              "bytes" to file.length(), "modified" to file.lastModified())
          }.sortedByDescending { it["modified"] as Long }
        return statusResult("ready", items, mediaTree(index).toString())
      } catch (error: ErrnoException) {
        // File.exists() alone would incorrectly report access denial as absence.
        if (error.errno != OsConstants.ENOENT && error.errno != OsConstants.ENOTDIR) needsAccess = true
      } catch (_: SecurityException) { needsAccess = true }
    }
    return statusResult(if (needsAccess) "needs_access" else "missing", emptyList(), initialUri)
  }

  private fun statusResult(state: String, items: List<Map<String, Any>>, initialUri: String): Map<String, Any> =
    mapOf("state" to state, "items" to items, "initialUri" to initialUri)

  private fun mediaTree(index: Int): Uri = DocumentsContract.buildTreeDocumentUri(
    "com.android.externalstorage.documents", "primary:${statusPaths[index].substringBeforeLast('/')}"
  )

  private fun statusFolder(root: Uri): Uri? {
    val info = metadata(root) ?: return null
    if (info["name"] == ".Statuses" && info["mime"] == DocumentsContract.Document.MIME_TYPE_DIR) return root
    val listed = children(root).firstOrNull { it["name"] == ".Statuses" && it["mime"] == DocumentsContract.Document.MIME_TYPE_DIR }
    if (listed != null) return Uri.parse(listed["uri"] as String)
    // Probe the fixed child because some providers omit hidden folder listings.
    val candidate = DocumentsContract.buildDocumentUriUsingTree(root, DocumentsContract.getDocumentId(root).trimEnd('/') + "/.Statuses")
    return try { if (metadata(candidate)?.get("mime") == DocumentsContract.Document.MIME_TYPE_DIR) candidate else null }
    catch (_: FileNotFoundException) { null }
  }

  private fun statusItems(folder: Uri): List<Map<String, Any>> = children(folder)
    .filter { (it["mime"] as String).startsWith("image/") || (it["mime"] as String).startsWith("video/") }
    .sortedByDescending { it["modified"] as Long }

  private fun safeName(value: String): String = value.replace(Regex("[^a-zA-Z0-9._-]"), "_").take(160).also {
    require(it.isNotBlank() && it != "." && it != "..") { "Invalid filename" }
  }

  private fun document(tree: String): Uri {
    val uri = Uri.parse(tree)
    require(uri.scheme == "content" && DocumentsContract.isTreeUri(uri)) { "Select a folder using Android's folder picker" }
    return DocumentsContract.buildDocumentUriUsingTree(uri, DocumentsContract.getTreeDocumentId(uri))
  }

  private fun metadata(uri: Uri): Map<String, Any>? = resolver.query(uri, null, null, null, null)?.use { cursor ->
    if (!cursor.moveToFirst()) null else row(uri, cursor)
  }

  private fun row(uri: Uri, cursor: android.database.Cursor): Map<String, Any> {
    fun text(column: String) = cursor.getString(cursor.getColumnIndexOrThrow(column)) ?: ""
    fun number(column: String): Long { val index = cursor.getColumnIndex(column); return if (index >= 0 && !cursor.isNull(index)) cursor.getLong(index) else 0L }
    val mime = text(DocumentsContract.Document.COLUMN_MIME_TYPE)
    return mapOf("id" to uri.toString(), "uri" to uri.toString(), "name" to text(DocumentsContract.Document.COLUMN_DISPLAY_NAME),
      "mime" to mime, "kind" to if (mime.startsWith("video/")) "video" else "image",
      "bytes" to number(DocumentsContract.Document.COLUMN_SIZE), "modified" to number(DocumentsContract.Document.COLUMN_LAST_MODIFIED))
  }

  private fun children(parent: Uri): List<Map<String, Any>> {
    val childUri = DocumentsContract.buildChildDocumentsUriUsingTree(parent, DocumentsContract.getDocumentId(parent))
    return resolver.query(childUri, null, null, null, null)?.use { cursor ->
      buildList { while (cursor.moveToNext()) {
        val id = cursor.getString(cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID))
        add(row(DocumentsContract.buildDocumentUriUsingTree(parent, id), cursor))
      } }
    } ?: throw FileNotFoundException("Cannot read this folder. Grant access again.")
  }

  private fun copy(source: String, destination: Uri) {
    val uri = Uri.parse(source)
    require(uri.scheme == "content" || uri.scheme == "file") { "Expected local media" }
    if (uri.scheme == "file") {
      val path = File(requireNotNull(uri.path)).canonicalFile
      val allowed = listOfNotNull(context.cacheDir, context.filesDir, context.externalCacheDir, context.getExternalFilesDir(null))
      val statusFile = statusDirectories.any { path.parentFile == it.canonicalFile }
      require(statusFile || allowed.any { path.path.startsWith(it.canonicalPath + File.separator) }) { "File is outside app staging or WhatsApp statuses" }
    }
    requireNotNull(resolver.openInputStream(uri)) { "Source no longer exists" }.use { input ->
      requireNotNull(resolver.openOutputStream(destination, "w")) { "Cannot write destination" }.use { output ->
        require(input.copyTo(output, 128 * 1024) > 0) { "The source file is empty" }
      }
    }
  }

  private fun exportTree(sourceUri: String, tree: String, source: String, name: String, mime: String): Map<String, String> {
    val root = document(tree)
    val folder = children(root).firstOrNull { it["name"] == source }?.let { Uri.parse(it["uri"] as String) }
      ?: requireNotNull(DocumentsContract.createDocument(resolver, root, DocumentsContract.Document.MIME_TYPE_DIR, source))
    val existing = children(folder).firstOrNull { it["name"] == name && (it["bytes"] as Long) > 0 }
    if (existing != null) return mapOf("uri" to existing["uri"] as String, "label" to "$source/$name")
    val pending = requireNotNull(DocumentsContract.createDocument(resolver, folder, mime, ".partial-${UUID.randomUUID()}"))
    try {
      copy(sourceUri, pending)
      val finalUri = requireNotNull(DocumentsContract.renameDocument(resolver, pending, name)) { "Folder provider could not finalize the file" }
      return mapOf("uri" to finalUri.toString(), "label" to "$source/$name")
    } catch (error: Exception) { DocumentsContract.deleteDocument(resolver, pending); throw error }
  }

  private fun exportPublic(sourceUri: String, source: String, name: String, mime: String): Map<String, String> {
    require(android.os.Build.VERSION.SDK_INT >= 29) { "Select a custom folder on Android 9 or earlier" }
    val collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI
    val path = "${Environment.DIRECTORY_DOWNLOADS}/UltraSave/$source/"
    resolver.query(collection, arrayOf(MediaStore.MediaColumns._ID), "${MediaStore.MediaColumns.DISPLAY_NAME}=? AND ${MediaStore.MediaColumns.RELATIVE_PATH}=? AND ${MediaStore.MediaColumns.IS_PENDING}=0", arrayOf(name, path), null)?.use { cursor ->
      if (cursor.moveToFirst()) return mapOf("uri" to android.content.ContentUris.withAppendedId(collection, cursor.getLong(0)).toString(), "label" to "$path$name")
    }
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, name); put(MediaStore.MediaColumns.MIME_TYPE, mime)
      put(MediaStore.MediaColumns.RELATIVE_PATH, path); put(MediaStore.MediaColumns.IS_PENDING, 1)
    }
    val pending = requireNotNull(resolver.insert(collection, values)) { "Cannot create download" }
    try {
      copy(sourceUri, pending)
      resolver.update(pending, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
      return mapOf("uri" to pending.toString(), "label" to "$path$name")
    } catch (error: Exception) { resolver.delete(pending, null, null); throw error }
  }
}
