import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../providers/AppProvider';
import { JobCard } from '../../features/downloads/JobCard';
import { Notice } from '../../components/Notice';
import { ui } from '../../styles/theme';
export default function Downloads() {
  const { jobs } = useApp();
  return <SafeAreaView style={ui.screen} edges={['top']}><ScrollView contentContainerStyle={ui.content}>
    <Text style={ui.eyebrow}>YOUR COLLECTION</Text><Text style={ui.title}>Downloads</Text><Text style={ui.body}>Progress, saved files and anything that needs a second try.</Text>
    {!jobs.length && <Notice title="A little empty, for now">Save a WhatsApp status or try a sample download from a source screen. Your files will appear here.</Notice>}
    {jobs.map(job => <JobCard key={job.id} job={job} />)}
  </ScrollView></SafeAreaView>;
}
