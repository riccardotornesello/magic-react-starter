import React from "react";

{{#if sitemap}}
// Data
import { sitemap } from "../../../Data/routes";

{{/if}}
// Styles
// import Style from "./{{viewName componentKey}}.module.css";

const {{viewName componentKey}} = () => {
  return (
    <div>
      <h2>{{title}}</h2>
      <p>Under construction</p>
{{#if sitemap}}
      {sitemap}
{{/if}}
    </div>
  );
};

export default {{viewName componentKey}};
