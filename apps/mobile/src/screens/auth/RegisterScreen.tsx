import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Picker,
  StatusBar,
} from 'react-native';
import { CustomTextInput } from '../../components/CustomTextInput';
import { CustomButton } from '../../components/CustomButton';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    confirmPassword: '',
    role: 'TENANT' as Role,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.username) {
      newErrors.username = 'Username is required';
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,}$/.test(form.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!form.cnic) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^\d{13}$/.test(form.cnic.replace(/\D/g, ''))) {
      newErrors.cnic = 'CNIC must be 13 digits';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        username: form.username,
        email: form.email,
        phone: form.phone,
        cnic: form.cnic,
        password: form.password,
        role: form.role,
      });

      await login(response.user, response.accessToken);

      // Navigate based on role using reset
      if (response.user.role === 'ADMIN') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminStack' }],
        });
      } else if (response.user.role === 'LANDLORD') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'LandlordStack' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'TenantStack' }],
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.appName}>Rentra</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join thousands of users finding their perfect rental
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <CustomTextInput
            label="Full Name"
            placeholder="Enter your full name"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
            error={errors.username}
            editable={!loading}
          />

          <CustomTextInput
            label="Email Address"
            placeholder="Enter your email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <CustomTextInput
            label="Phone Number"
            placeholder="Enter your phone number"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            error={errors.phone}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <CustomTextInput
            label="CNIC"
            placeholder="Enter your CNIC number"
            value={form.cnic}
            onChangeText={(text) => setForm({ ...form, cnic: text })}
            error={errors.cnic}
            keyboardType="numeric"
            editable={!loading}
          />

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            <Text style={styles.label}>I am a</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => setForm({ ...form, role: value })}
                enabled={!loading}
              >
                <Picker.Item label="Tenant (Looking for rental)" value="TENANT" />
                <Picker.Item label="Landlord (Renting out property)" value="LANDLORD" />
              </Picker>
            </View>
          </View>

          <CustomTextInput
            label="Password"
            placeholder="Enter your password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            error={errors.password}
            secureTextEntry
            editable={!loading}
          />

          <CustomTextInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChangeText={(text) =>
              setForm({ ...form, confirmPassword: text })
            }
            error={errors.confirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <CustomButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.footerLink}>Sign in here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 14,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  roleContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
});
