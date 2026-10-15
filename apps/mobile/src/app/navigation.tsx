import type {
  CustomerTabParamList,
  SupervisorTabParamList,
  TechnicianTabParamList,
} from "@/app/navigation-types";
import { UiKitPreviewScreen } from "@/app/ui-kit-preview";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuthSession } from "@/features/auth/auth-session";
import { LoginScreen } from "@/features/auth/login-screen";
import { ChatScreen } from "@/features/chat/chat-screen";
import { CustomerBillingScreen } from "@/features/customer/billing-screen";
import { CustomerContractScreen } from "@/features/customer/contract-screen";
import { CustomerHomeScreen } from "@/features/customer/home-screen";
import { CustomerMyTicketScreen } from "@/features/customer/my-ticket-screen";
import { SupervisorTeamScreen } from "@/features/supervisor/team-screen";
import { SupervisorTechnicianScreen } from "@/features/supervisor/technician-screen";
import { TechnicianCaseScreen } from "@/features/technician/case-screen";
import { TechnicianQueueScreen } from "@/features/technician/queue-screen";
import { THEME } from "@/lib/theme";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Activity,
  CreditCard,
  FileText,
  Home,
  MessageSquare,
  Ticket,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import * as React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

export type RootStackParamList = {
  Login: undefined;
  CustomerApp: undefined;
  TechnicianApp: undefined;
  SupervisorApp: undefined;
  UiKitPreview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const TechnicianTab = createBottomTabNavigator<TechnicianTabParamList>();
const SupervisorTab = createBottomTabNavigator<SupervisorTabParamList>();

const SignOutButton = () => {
  const { signOut } = useAuthSession();
  return (
    <Pressable
      onPress={() => {
        void signOut();
      }}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      className="min-h-11 min-w-11 items-center justify-center px-3"
    >
      <Text className="text-xs font-bold uppercase tracking-wider text-primary">Salir</Text>
    </Pressable>
  );
};

const CustomerNavigator = () => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "light" ? THEME.light : THEME.dark;

  return (
    <CustomerTab.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 16,
        },
        headerRight: SignOutButton,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <CustomerTab.Screen
        name="Inicio"
        component={CustomerHomeScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Icon as={Home} size={size} color={color} />
          ),
        }}
      />
      <CustomerTab.Screen
        name="Facturación"
        component={CustomerBillingScreen}
        options={{
          title: "Facturación",
          tabBarIcon: ({ color, size }) => (
            <Icon as={CreditCard} size={size} color={color} />
          ),
        }}
      />
      <CustomerTab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Icon as={MessageSquare} size={size} color={color} />
          ),
        }}
      />
      <CustomerTab.Screen
        name="Mi ticket"
        component={CustomerMyTicketScreen}
        options={{
          title: "Mi ticket",
          tabBarIcon: ({ color, size }) => (
            <Icon as={Ticket} size={size} color={color} />
          ),
        }}
      />
      <CustomerTab.Screen
        name="Contrato"
        component={CustomerContractScreen}
        options={{
          title: "Contrato",
          tabBarIcon: ({ color, size }) => (
            <Icon as={FileText} size={size} color={color} />
          ),
        }}
      />
    </CustomerTab.Navigator>
  );
};

const TechnicianNavigator = () => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "light" ? THEME.light : THEME.dark;

  return (
    <TechnicianTab.Navigator
      initialRouteName="Cola"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerRight: SignOutButton,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
      }}
    >
      <TechnicianTab.Screen
        name="Cola"
        component={TechnicianQueueScreen}
        options={{
          title: "Cola",
          tabBarIcon: ({ color, size }) => (
            <Icon as={Ticket} size={size} color={color} />
          ),
        }}
      />
      <TechnicianTab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Icon as={MessageSquare} size={size} color={color} />
          ),
        }}
      />
      <TechnicianTab.Screen
        name="Caso"
        component={TechnicianCaseScreen}
        options={{
          title: "Caso",
          tabBarIcon: ({ color, size }) => (
            <Icon as={Activity} size={size} color={color} />
          ),
        }}
      />
    </TechnicianTab.Navigator>
  );
};

const SupervisorNavigator = () => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "light" ? THEME.light : THEME.dark;

  return (
    <SupervisorTab.Navigator
      initialRouteName="Equipo"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerRight: SignOutButton,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
      }}
    >
      <SupervisorTab.Screen
        name="Equipo"
        component={SupervisorTeamScreen}
        options={{
          title: "Equipo",
          tabBarIcon: ({ color, size }) => (
            <Icon as={Home} size={size} color={color} />
          ),
        }}
      />
      <SupervisorTab.Screen
        name="Técnico"
        component={SupervisorTechnicianScreen}
        options={{
          title: "Técnico",
          tabBarIcon: ({ color, size }) => (
            <Icon as={FileText} size={size} color={color} />
          ),
        }}
      />
      <SupervisorTab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Icon as={MessageSquare} size={size} color={color} />
          ),
        }}
      />
    </SupervisorTab.Navigator>
  );
};

export const RootNavigator = () => {
  const { session, profile, isReady } = useAuthSession();

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator accessibilityLabel="Cargando sesión" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          {profile?.role === "technician" ? (
            <Stack.Screen
              name="TechnicianApp"
              component={TechnicianNavigator}
            />
          ) : profile?.role === "supervisor" ? (
            <Stack.Screen
              name="SupervisorApp"
              component={SupervisorNavigator}
            />
          ) : (
            <Stack.Screen
              name="CustomerApp"
              component={CustomerNavigator}
            />
          )}
          {__DEV__ ? (
            <Stack.Screen
              name="UiKitPreview"
              component={UiKitPreviewScreen}
              options={{ headerShown: true, title: "Kit UI" }}
            />
          ) : null}
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};
