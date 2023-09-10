import React, { useState } from "react";

// Libraries
import { Outlet } from "react-router-dom";

// Styles
// import Style from "./{{layoutName componentKey}}.module.css";

const {{layoutName componentKey}} = () => {
  return (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default {{layoutName componentKey}};
