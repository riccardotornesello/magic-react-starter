import React from "react";

// Icons
import { BiMenuAltLeft } from "react-icons/bi";
import { HiOutlineMenuAlt1 } from "react-icons/hi";

// Utils

// Styles
import Style from "./Navbar.module.css";

const Navbar = (props) => {
  return (
    <div className={Style.mainContainer}>
      <div className={Style.content}>
        <div className={Style.contentLeft}>
          <div
            className={Style.menuButton}
            onClick={() => props.setSidebarIsOpen(!props.sidebarIsOpen)}
          >
            {props.sidebarIsOpen ? <BiMenuAltLeft /> : <HiOutlineMenuAlt1 />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
