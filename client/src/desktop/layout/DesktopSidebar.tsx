import React from "react";
import { Sidebar, SidebarProps } from "./Sidebar";

export interface DesktopSidebarProps extends SidebarProps {}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = (props) => {
  return <Sidebar {...props} />;
};
