import React from "react";
import { Sidebar, SidebarProps } from "../../components/layout/Sidebar";

export interface DesktopSidebarProps extends SidebarProps {}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = (props) => {
  return <Sidebar {...props} />;
};
