import { Route } from "react-router-dom";

// Icons
import { {{concatenate icons}} } from "react-icons/ai";

// Layouts
{{#each layouts}}
import {{layoutName @key}} from "../Layouts/{{layoutName @key}}/{{layoutName @key}}";
{{/each}}

{{#each layouts}}
// {{camelName @key}} Views
{{generateViewImports this.routes @key}}

{{/each}}

const routes = {
{{generateRoutes layouts}}
};

function generatePaths(routes, parentPath = "") {
  const paths = {};
  Object.entries(routes).forEach(([routeName, route]) => {
    if (route.routes) {
      paths[routeName] = generatePaths(route.routes, parentPath + route.path);
    } else {
      paths[routeName] = parentPath + route.path;
    }
  });
  return paths;
}

function generateRouteComponents(routes, parentPath = "") {
  if (parentPath === "") {
    // Is a layout
    return Object.keys(routes).map((routeName, index) => {
      return (
        <Route key={index} element={routes[routeName].element}>
          {generateRouteComponents(routes[routeName].routes, routes[routeName].path)}
        </Route>
      );
    });
  } else {
    // Is a view
    const views = [];

    Object.keys(routes).forEach((routeName, index) => {
      views.push(
        <Route
          key={index}
          path={parentPath + routes[routeName].path}
          element={routes[routeName].element}
        />
      );

      if (routes[routeName].routes) {
        views.push(
          generateRouteComponents(
            routes[routeName].routes,
            parentPath + routes[routeName].path
          )
        );
      }
    });
    return views;
  }
}

function generateSitemap(routes, parentPath = "") {
  return (
    <ol style=\{{ marginLeft: "2em" }}>
      {Object.keys(routes).map((routeName, index) => {
        return (
          <li key={index}>
            {parentPath === "" ? (
              routes[routeName].title
            ) : (
              <a href={parentPath + routes[routeName].path}>
                {routes[routeName].title} ({parentPath + routes[routeName].path}
                )
              </a>
            )}

            {routes[routeName].routes &&
              generateSitemap(
                routes[routeName].routes,
                parentPath + routes[routeName].path
              )}
          </li>
        );
      })}
    </ol>
  );
}

const paths = generatePaths(routes);
const routeComponents = generateRouteComponents(routes);
const sitemap = generateSitemap(routes);

export { routes, paths, routeComponents, sitemap };
