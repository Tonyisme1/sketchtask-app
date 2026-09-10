import React from "react";
import { MobileNav as BaseMobileNav, MobileNavProps } from "../../components/layout/MobileNav";

export const MobileNav: React.FC<MobileNavProps> = (props) => {
  return <BaseMobileNav {...props} />;
};
