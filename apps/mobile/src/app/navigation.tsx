import type {
  CustomerStackParamList,
  CustomerTabParamList,
  RootStackParamList,
  SupervisorTabParamList,
  TechnicianTabParamList,
} from "@/app/navigation-types";
import { UiKitPreviewScreen } from "@/app/ui-kit-preview";
import { AppHeader } from "@/components/app-header";
import { GlassTabBar } from "@/components/glass-tab-bar";
import { ChatBackHeader } from "@/features/chat/chat-back-header";
import { Icon } from "@/components/ui/icon";
import { useAuthSession } from "@/features/auth/auth-session";
import { LoginScreen } from "@/features/auth/login-screen";
import { ChatScreen } from "@/features/chat/chat-screen";
import { CustomerBillingNavigator } from "@/features/customer/billing-navigator";
import { CustomerContractScreen } from "@/features/customer/contract-screen";
import { CustomerDevicesScreen } from "@/features/customer/devices-screen";
import { CustomerFaqScreen } from "@/features/customer/faq-screen";
import { CustomerHomeScreen } from "@/features/customer/home-screen";
import { CustomerMyTicketScreen } from "@/features/customer/my-ticket-screen";
import { SupervisorTeamScreen } from "@/features/supervisor/team-screen";
import { SupervisorTechnicianScreen } from "@/features/supervisor/technician-screen";
import { TechnicianCaseScreen } from "@/features/technician/case-screen";
import { TechnicianQueueScreen } from "@/features/technician/queue-screen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Activity,
  FileText,
  Home,
  MessageSquare,
  Ticket,
} from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, View } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();
const CustomerStack = createNativeStackNavigator<CustomerStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const TechnicianTab = createBottomTabNavigator<TechnicianTabParamList>();
const SupervisorTab = createBottomTabNavigator<SupervisorTabParamList>();

// 👇 `tabBar` es una PROP del navigator (no una opción de screenOptions).
// Se define aquí y se pasa como prop en cada Tab.Navigator.
const renderGlassTabBar = (props: React.ComponentProps<typeof GlassTabBar>) => (
  <GlassTabBar {...props} />
);

const glassTabScreenOptions = {
  tabBarShowLabel: false,
  tabBarHideOnKeyboard: true,
  tabBarStyle: {
    position: "absolute" as const,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
};

const hiddenTabBarStyle = {
  display: "none" as const,
};

const chatTabOptions = (backRoute: string) => ({
  title: "Chat",
  tabBarStyle: hiddenTabBarStyle,
  header: ({
    navigation,
  }: {
    navigation: { navigate: (name: string) => void };
  }) => (
    <ChatBackHeader
      onBack={() => {
        navigation.navigate(backRoute);
      }}
    />
  ),
  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
    <Icon as={MessageSquare} size={size} color={color} />
  ),
});

const CustomerTabs = () => {
  return (
    <CustomerTab.Navigator
      initialRouteName="Inicio"
      tabBar={renderGlassTabBar}
      screenOptions={{
        ...glassTabScreenOptions,
        header: ({ route }) => (
          <AppHeader
            subtitle={
              route.name === "Inicio"
                ? "COBERTURA NACIONAL"
                : `${route.name.toUpperCase()} · COBERTURA NACIONAL`
            }
          />
        ),
      }}>
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
        name="Chat"
        component={ChatScreen}
        options={chatTabOptions("Inicio")}
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
    </CustomerTab.Navigator>
  );
};

const CustomerNavigator = () => {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="CustomerTabs" component={CustomerTabs} />
      <CustomerStack.Screen
        name="Facturación"
        component={CustomerBillingNavigator}
        options={{ headerShown: false }}
      />
      <CustomerStack.Screen
        name="Contrato"
        component={CustomerContractScreen}
        options={{
          headerShown: true,
          title: "Contrato",
        }}
      />
      <CustomerStack.Screen
        name="Ayuda"
        component={CustomerFaqScreen}
        options={{
          headerShown: true,
          title: "Preguntas frecuentes",
        }}
      />
      <CustomerStack.Screen
        name="Dispositivos"
        component={CustomerDevicesScreen}
        options={{
          headerShown: true,
          title: "Dispositivos",
        }}
      />
    </CustomerStack.Navigator>
  );
};

const TechnicianNavigator = () => {
  return (
    <TechnicianTab.Navigator
      initialRouteName="Cola"
      tabBar={renderGlassTabBar}
      screenOptions={{
        ...glassTabScreenOptions,
        header: ({ route }) => (
          <AppHeader subtitle={`TÉCNICO · ${route.name.toUpperCase()}`} />
        ),
      }}>
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
        options={chatTabOptions("Cola")}
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
  return (
    <SupervisorTab.Navigator
      initialRouteName="Equipo"
      tabBar={renderGlassTabBar}
      screenOptions={{
        ...glassTabScreenOptions,
        header: ({ route }) => (
          <AppHeader subtitle={`SUPERVISIÓN · ${route.name.toUpperCase()}`} />
        ),
      }}>
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
        options={chatTabOptions("Equipo")}
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
            <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
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
