import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function GoalsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Goals</ThemedText>
      <ThemedText>Set and track your goals here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 90,
  },
});

