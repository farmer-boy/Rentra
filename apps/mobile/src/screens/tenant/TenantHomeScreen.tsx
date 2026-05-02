import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { CustomButton } from '../../components/CustomButton';

interface TenantHomeScreenProps {
  navigation: any;
}

export const TenantHomeScreen: React.FC<TenantHomeScreenProps> = ({
  navigation,
}) => {
  const { user, logout } = useAuthStore();
  const [loadingLogout, setLoadingLogout] = React.useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          setLoadingLogout(true);
          try {
            await logout();
            // Use reset to go back to auth stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'AuthStack' }],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          } finally {
            setLoadingLogout(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.fullName}!</Text>
        <Text style={styles.subtitle}>Tenant Dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{user?.phone}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Trust Score:</Text>
          <Text style={styles.value}>{user?.trustScore}/100</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, user?.isVerified && styles.verified]}>
            {user?.isVerified ? 'Verified ✓' : 'Not Verified'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>🏠 Browse Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>📋 My Agreements</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>💳 Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>💬 Messages</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <CustomButton
          title="Logout"
          onPress={handleLogout}
          loading={loadingLogout}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#667eea',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  verified: {
    color: '#10b981',
  },
  actionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
});
