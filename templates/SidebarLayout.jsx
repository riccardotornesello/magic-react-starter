import React, { useState } from "react";

// Components
import Sidebar from "../../Components/UIKit/Sidebar/Sidebar";
import Navbar from "../../Components/UIKit/Navbar/Navbar";

// Libraries
import { Outlet } from "react-router-dom";

// Data
import { routes } from "../../Data/routes";

// Styles
import Style from "./{{layoutName componentKey}}.module.css";

const {{layoutName componentKey}} = () => {
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

  const closeSidebar = () => {
    if (window.innerWidth < 991 && sidebarIsOpen) {
      setSidebarIsOpen(false);
    }
  };

  return (
    <div className={Style.layouting}>
      <Sidebar sidebarIsOpen={sidebarIsOpen} route={routes["{{componentKey}}"]} />
      <div className={Style.mainContainer} onClick={() => closeSidebar()}>
        <Navbar
          sidebarIsOpen={sidebarIsOpen}
          setSidebarIsOpen={setSidebarIsOpen}
        />
        <main className={Style.contentContainer}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default {{layoutName componentKey}};
