import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TenantHomeScreen } from '../screens/tenant/TenantHomeScreen';
import { LandlordHomeScreen } from '../screens/landlord/LandlordHomeScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const TenantStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TenantHome"
        component={TenantHomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const LandlordStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#10b981',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="LandlordHome"
        component={LandlordHomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AdminStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ef4444',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <NavigationContainer
      linking={{
        prefixes: ['exp://', 'http://', 'https://'],
        config: {
          screens: {
            AuthStack: 'auth',
            TenantStack: 'tenant',
            LandlordStack: 'landlord',
            AdminStack: 'admin',
          },
        },
      }}
    >
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animationEnabled: true,
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="AuthStack"
            component={AuthStack}
            options={{
              animationEnabled: true,
            }}
          />
        ) : user?.role === 'TENANT' ? (
          <Stack.Screen
            name="TenantStack"
            component={TenantStack}
            options={{
              animationEnabled: true,
            }}
          />
        ) : user?.role === 'LANDLORD' ? (
          <Stack.Screen
            name="LandlordStack"
            component={LandlordStack}
            options={{
              animationEnabled: true,
            }}
          />
        ) : user?.role === 'ADMIN' ? (
          <Stack.Screen
            name="AdminStack"
            component={AdminStack}
            options={{
              animationEnabled: true,
            }}
          />
        ) : (
          <Stack.Screen
            name="AuthStack"
            component={AuthStack}
            options={{
              animationEnabled: true,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
