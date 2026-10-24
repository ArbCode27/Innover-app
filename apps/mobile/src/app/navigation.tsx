import type {
  CustomerStackParamList,
  CustomerTabParamList,
  RootStackParamList,
  SupervisorStackParamList,
  SupervisorTabParamList,
  TechnicianStackParamList,
  TechnicianTabParamList,
} from "@/app/navigation-types";
import { UiKitPreviewScreen } from "@/app/ui-kit-preview";
import { AppBootScreen } from "@/components/app-boot-screen";
import { AppHeader } from "@/components/app-header";
import { GlassTabBar } from "@/components/glass-tab-bar";
import { ChatBackHeader } from "@/features/chat/chat-back-header";
import { ChatTabIcon } from "@/features/chat/chat-tab-icon";
import { Icon } from "@/components/ui/icon";
import { useAuthSession } from "@/features/auth/auth-session";
import { LoginScreen } from "@/features/auth/login-screen";
import { ChatScreen } from "@/features/chat/chat-screen";
import { SupervisorTicketDetailScreen } from "@/features/supervisor/ticket-detail-screen";
import { CustomerBillingNavigator } from "@/features/customer/billing-navigator";
import { CustomerContractScreen } from "@/features/customer/contract-screen";
import { CustomerDevicesScreen } from "@/features/customer/devices-screen";
import { CustomerFaqScreen } from "@/features/customer/faq-screen";
import { CustomerHomeScreen } from "@/features/customer/home-screen";
import { CustomerMyTicketScreen } from "@/features/customer/my-ticket-screen";
import { SupervisorMetricsScreen } from "@/features/supervisor/metrics-screen";
import { SupervisorResolvedScreen } from "@/features/supervisor/resolved-screen";
import { SupervisorTeamScreen } from "@/features/supervisor/team-screen";
import { TechnicianCaseScreen } from "@/features/technician/case-screen";
import { TechnicianQueueScreen } from "@/features/technician/queue-screen";
import { TechnicianResolvedScreen } from "@/features/technician/resolved-screen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  BarChart3,
  CheckCircle2,
  Home,
  Ticket,
} from "lucide-react-native";
import * as React from "react";

const Stack = createNativeStackNavigator<RootStackParamList>();
const CustomerStack = createNativeStackNavigator<CustomerStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const TechnicianStack = createNativeStackNavigator<TechnicianStackParamList>();
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

const chatTabOptions = (
  backRoute: string,
  options?: { field?: boolean; headerTitle?: string; headerSubtitle?: string },
) => ({
  title: options?.field ? options.headerTitle ?? "Oficina" : "Chat",
  tabBarStyle: hiddenTabBarStyle,
  header: ({
    navigation,
  }: {
    navigation: { navigate: (name: string) => void };
  }) => (
    <ChatBackHeader
      variant={options?.field ? "field" : "customer"}
      title={options?.headerTitle}
      subtitle={options?.headerSubtitle}
      onBack={() => {
        navigation.navigate(backRoute);
      }}
    />
  ),
  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
    <ChatTabIcon
      color={color}
      size={size}
      showUnreadBadge={Boolean(options?.field)}
    />
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
        options={chatTabOptions("Inicio", { field: false })}
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

const TechnicianTabs = () => {
  return (
    <TechnicianTab.Navigator
      initialRouteName="Cola"
      tabBar={renderGlassTabBar}
      screenOptions={{
        ...glassTabScreenOptions,
        header: ({ route }) => (
          <AppHeader subtitle={`TÉCNICO · ${route.name.toUpperCase()}`} />
        ),
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
        options={chatTabOptions("Cola", {
          field: true,
          headerTitle: "Oficina",
          headerSubtitle: "Soporte de campo",
        })}
      />
      <TechnicianTab.Screen
        name="Resueltos"
        component={TechnicianResolvedScreen}
        options={{
          title: "Resueltos",
          tabBarIcon: ({ color, size }) => (
            <Icon as={CheckCircle2} size={size} color={color} />
          ),
        }}
      />
    </TechnicianTab.Navigator>
  );
};

const TechnicianNavigator = () => {
  return (
    <TechnicianStack.Navigator>
      <TechnicianStack.Screen
        name="TechnicianTabs"
        component={TechnicianTabs}
        options={{ headerShown: false }}
      />
      <TechnicianStack.Screen
        name="Caso"
        component={TechnicianCaseScreen}
        options={{
          headerShown: true,
          title: "Detalle del caso",
        }}
      />
    </TechnicianStack.Navigator>
  );
};

const SupervisorStack = createNativeStackNavigator<SupervisorStackParamList>();

const SupervisorTabs = () => {
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
        name="Resueltos"
        component={SupervisorResolvedScreen}
        options={{
          title: "Resueltos",
          tabBarIcon: ({ color, size }) => (
            <Icon as={CheckCircle2} size={size} color={color} />
          ),
        }}
      />
      <SupervisorTab.Screen
        name="Métricas"
        component={SupervisorMetricsScreen}
        options={{
          title: "Métricas",
          tabBarIcon: ({ color, size }) => (
            <Icon as={BarChart3} size={size} color={color} />
          ),
        }}
      />
    </SupervisorTab.Navigator>
  );
};

const SupervisorNavigator = () => {
  return (
    <SupervisorStack.Navigator>
      <SupervisorStack.Screen
        name="SupervisorTabs"
        component={SupervisorTabs}
        options={{ headerShown: false }}
      />
      <SupervisorStack.Screen
        name="TicketDetalle"
        component={SupervisorTicketDetailScreen}
        options={{
          headerShown: true,
          title: "Detalle del ticket",
        }}
      />
    </SupervisorStack.Navigator>
  );
};

export const RootNavigator = () => {
  const { session, profile, isReady } = useAuthSession();

  if (!isReady) {
    return <AppBootScreen />;
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
