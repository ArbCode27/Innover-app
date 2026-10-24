import type { RootStackParamList } from "@/app/navigation-types";
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const openInboxChat = () => {
  if (!navigationRef.isReady()) {
    return;
  }

  const state = navigationRef.getRootState();
  if (!state) {
    return;
  }
  const current = state.routes[state.index ?? 0];
  if (!current) {
    return;
  }

  if (current.name === "CustomerApp") {
    navigationRef.navigate("CustomerApp", {
      screen: "CustomerTabs",
      params: { screen: "Chat" },
    });
    return;
  }

  if (current.name === "TechnicianApp") {
    navigationRef.navigate("TechnicianApp", {
      screen: "TechnicianTabs",
      params: { screen: "Chat" },
    });
  }
};

export const openMyTicket = () => {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate("CustomerApp", {
    screen: "CustomerTabs",
    params: { screen: "Mi ticket" },
  });
};
