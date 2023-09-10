import React, { useState } from "react";

// Components
import { Link, useLocation } from "react-router-dom";

// Assets
import LogoBlack from "../../../Assets/logos/logo-black.png";
import LogoCompact from "../../../Assets/logos/logo-compact.png";
import { FiChevronDown } from "react-icons/fi";

// Hooks
import useMediaQuery from "../../../Hooks/useMediaQuery";

// Utils
import classNames from "../../../Utils/classNames";

// Styles
import Style from "./Sidebar.module.css";

const sidebarClass = (sidebarIsOpen, over, isDesktop) => {
  if (isDesktop) {
    // Desktop
    if (sidebarIsOpen) {
      return Style.sidebar;
    } else {
      if (over === true) return Style.sidebar;
      else return Style.sidebarCollapse;
    }
  } else {
    // Mobile
    if (sidebarIsOpen) {
      return Style.sidebarMobile;
    } else {
      return Style.sidebarCollapseMobile;
    }
  }
};

const dropdownLabelClass = (routeBasePath, location) => {
  if (location.pathname === routeBasePath) return Style.elementActive;
  else return Style.element;
};

const linkLabelClass = (isOpen) => {
  if (isOpen) return Style.mainCategoryOpenCollapsed;
  else return Style.mainCategory;
};

const Sidebar = ({ route, sidebarIsOpen }) => {
  const [over, setOver] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState(
    Object.keys(route.routes).map(() => false)
  );
  const isDesktop = useMediaQuery("(min-width: 991px)");

  const setDropdownOpen = (index, open) => {
    setOpenDropdowns((oldOpenDropdowns) => {
      const newOpenDropdowns = [...oldOpenDropdowns];
      newOpenDropdowns[index] = open;
      return newOpenDropdowns;
    });
  };

  return (
    <div
      className={sidebarClass(sidebarIsOpen, over, isDesktop)}
      onMouseOver={() => {
        setOver(true);
      }}
      onMouseLeave={() => {
        setOver(false);
      }}
    >
      {/* TOP Sidebar */}
      <div className={Style.boxLogo}>
        {isDesktop && (sidebarIsOpen || over) ? (
          <img src={LogoBlack} alt="Logo" />
        ) : (
          <img src={LogoCompact} alt="" />
        )}
      </div>

      <div className={Style.boxNav}>
        {/* CENTER Sidebar */}
        <div className={Style.navigator}>
          {/* Menu List */}
          <nav>
            <ul>
              {Object.entries(route.routes).map(([key, val], i) => {
                if (val.routes)
                  return (
                    <NavMenu
                      key={key}
                      route={val}
                      basePath={route.path}
                      isOpen={(sidebarIsOpen || over) && openDropdowns[i]}
                      setOpen={(open) => setDropdownOpen(i, open)}
                    />
                  );
                else
                  return (
                    <NavSimple key={key} basePath={route.path} route={val} />
                  );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

const NavSimple = ({ route, basePath }) => {
  const location = useLocation();

  const routeBasePath = `${basePath}${route.path}`;

  return (
    <li className={dropdownLabelClass(routeBasePath, location)}>
      <Link to={routeBasePath}>
        <LabelLinkSimple icon={route.icon} title={route.title} />
      </Link>
    </li>
  );
};

const LabelLinkSimple = ({ icon, title }) => {
  return (
    <div className={Style.mainCategory}>
      <div className={Style.innerCategory}>
        <div
          style={{ height: "auto", width: 20, marginRight: 10 }}
          className={Style.icon}
        >
          {icon}
        </div>
        <span className={Style.categoryText}>{title}</span>
      </div>
    </div>
  );
};

const NavMenu = ({ route, basePath, isOpen, setOpen }) => {
  const location = useLocation();

  const routeBasePath = `${basePath}${route.path}`;

  return (
    <li className={dropdownLabelClass(routeBasePath, location)}>
      <LabelLink
        icon={route.icon}
        routes={route.routes}
        title={route.title}
        isOpen={isOpen}
        setOpen={setOpen}
      />
      <Dropdown
        isOpen={isOpen}
        routes={route.routes}
        basePath={routeBasePath}
      />
    </li>
  );
};

const LabelLink = ({ icon, routes, title, isOpen, setOpen }) => {
  return (
    <div
      className={linkLabelClass(isOpen)}
      onClick={() => {
        setOpen(!isOpen);
      }}
    >
      <div className={Style.innerCategory}>
        <div
          style={{ height: "auto", width: 20, marginRight: 10 }}
          className={Style.icon}
        >
          {icon}
        </div>
        <span className={Style.categoryText}>{title}</span>
      </div>
      {routes && (
        <FiChevronDown
          className={classNames(Style.arrow, {
            class: Style.arrowActive,
            condition: isOpen,
          })}
        />
      )}
    </div>
  );
};

const Dropdown = ({ isOpen, routes, basePath }) => {
  return (
    <ul
      style={{
        height: isOpen ? `${Object.keys(routes).length * 47.6}px` : "0px",
      }}
      className={classNames(Style.closeDropdown, {
        class: Style.active,
        condition: isOpen,
      })}
    >
      {Object.entries(routes).map(([key, val]) => {
        return <DropdownElement key={key} route={val} basePath={basePath} />;
      })}
    </ul>
  );
};

const DropdownElement = ({ route, basePath }) => {
  const location = useLocation();

  const routeBasePath = `${basePath}${route.path}`;

  return (
    <li>
      <div className={Style.subCategory}>
        <div className={Style.innerSub}>
          <Link to={routeBasePath}>
            <div
              className={
                location.pathname === routeBasePath
                  ? Style.innerElementActive
                  : Style.innerElement
              }
            >
              {route.title}
            </div>
          </Link>
        </div>
      </div>
    </li>
  );
};

export default Sidebar;
