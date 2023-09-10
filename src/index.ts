#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import path from "path";
import { Command } from "commander";
import { spawn } from "child_process";
import fs from "fs";
import process from "process";
import Handlebars, { SafeString } from "handlebars";
import Joi from "joi";
import simpleGit, { SimpleGit } from "simple-git";

/*****************************************
 * Project constants
 *****************************************/

const directoryStructure = [
  "Assets/images",
  "Assets/icons",
  "Assets/logos",
  "Assets/videos",
  "Components/Advanced",
  "Components/UIKit",
  "Data",
  "Hooks",
  "Layouts",
  "Utils",
  "Views",
];

const dependencies = [
  "react-router-dom",
  "react-icons",
  "@hybris-software/use-query",
  "@hybris-software/use-auth",
];

const viewSchema = Joi.object({
  title: Joi.string().default("Insert title"),
  icon: Joi.string().default("AiFillHome"),
  sitemap: Joi.boolean().default(false),
  routes: Joi.object().pattern(/^/, Joi.link("#view")),
})
  .unknown()
  .id("view");

const routesSchema = Joi.object()
  .pattern(
    /^/,
    Joi.object({
      title: Joi.string().default("Insert title"),
      sidebar: Joi.boolean().default(false),
      routes: Joi.object().pattern(/^/, viewSchema),
    }).unknown()
  )
  .unknown();

/*****************************************
 * Initialize Handlebars helpers
 *****************************************/
Handlebars.registerHelper("viewName", viewName);
Handlebars.registerHelper("layoutName", layoutName);
Handlebars.registerHelper("camelName", camelName);
Handlebars.registerHelper("generateViewImports", generateViewImports);
Handlebars.registerHelper("generateRoutes", generateRoutes);
Handlebars.registerHelper("concatenate", concatenate);

/*****************************************
 * Create Node program
 *****************************************/
const program = new Command();
program
  .name("magic-react")
  .description("CLI to initialize a special React project")
  .version("0.1.0")
  .argument("<project-name>", "name of the react project")
  .argument("<routes-file>", "location of the routes JSON file")
  .option("--skip-creation")
  .option("--no-commit")
  .action(main);
program.parse();

/*****************************************
 * Main logic
 *****************************************/
async function main(projectName: string, routesFile: string, options: any) {
  clear();
  showBanner();

  // Check if project directory already exists
  if (!options.skipCreation && fs.existsSync(projectName)) {
    console.log(chalk.red(`Directory "${projectName}" already exists`));
    process.exit(-1);
  }

  // Validate routes JSON
  if (!fs.existsSync(routesFile)) {
    console.log(chalk.red(`Routes file "${routesFile}" does not exist`));
    process.exit(-1);
  }

  const rawRoutesData = fs.readFileSync(routesFile);
  const jsonRoutesData = JSON.parse(rawRoutesData.toString());
  const { error, value: routesData } = routesSchema.validate(jsonRoutesData);
  if (error !== undefined) {
    console.log(chalk.red(`Invalid routes file`));
    console.log(chalk.red(error));
    process.exit(-1);
  }

  // Create the react project
  if (!options.skipCreation) {
    await initReactProject(projectName);
  }

  // Install dependencies
  await installProjectDependencies(projectName);

  // Remove useless files (App.*, *.svg)
  fs.readdirSync(path.join(projectName, "src"))
    .filter((f) => /(^App[.])|([.]svg$)/.test(f))
    .map((f) => fs.unlinkSync(path.join(projectName, "src", f)));

  // Copy static files
  const projectTemplateDirectory = path.join(
    path.dirname(__dirname),
    "project_template"
  );
  fs.cpSync(projectTemplateDirectory, projectName, { recursive: true });

  // Open template files
  const templatesDirectory = path.join(path.dirname(__dirname), "templates");
  const layoutSource = fs.readFileSync(
    path.join(templatesDirectory, "Layout.jsx"),
    {
      encoding: "utf8",
      flag: "r",
    }
  );
  const viewSource = fs.readFileSync(
    path.join(templatesDirectory, "View.jsx"),
    {
      encoding: "utf8",
      flag: "r",
    }
  );
  const viewIndexSource = fs.readFileSync(
    path.join(templatesDirectory, "ViewIndex.js"),
    {
      encoding: "utf8",
      flag: "r",
    }
  );
  const sidebarLayoutSource = fs.readFileSync(
    path.join(templatesDirectory, "SidebarLayout.jsx"),
    {
      encoding: "utf8",
      flag: "r",
    }
  );

  await Promise.all(
    Object.keys(routesData).map(async (layoutKey) => {
      let layoutTemplate = "";
      if (routesData[layoutKey].sidebar) {
        layoutTemplate = await compileTemplate(sidebarLayoutSource, {
          componentKey: layoutKey,
        });
      } else {
        layoutTemplate = await compileTemplate(layoutSource, {
          componentKey: layoutKey,
        });
      }

      // Create layout directory
      const layoutPath = path.join(
        projectName,
        "src",
        "Layouts",
        layoutName(layoutKey)
      );
      await createDirectory(path.join(layoutPath));

      // Insert files
      fs.writeFileSync(
        path.join(layoutPath, `${layoutName(layoutKey)}.jsx`),
        layoutTemplate
      );
      if (routesData[layoutKey].sidebar) {
        fs.copyFileSync(
          path.join(
            path.dirname(__dirname),
            "templates",
            "SidebarLayout.module.css"
          ),
          path.join(layoutPath, `${layoutName(layoutKey)}.module.css`)
        );
      } else {
        fs.closeSync(
          fs.openSync(
            path.join(layoutPath, `${layoutName(layoutKey)}.module.css`),
            "w"
          )
        );
      }

      if (routesData[layoutKey].routes !== undefined) {
        await createViewDirectory({
          routes: routesData[layoutKey].routes,
          viewSource,
          viewIndexSource,
          projectName,
          layoutKey,
          allRoutes: routesData,
        });
      }
    })
  );

  // Create routes file
  const routesSource = fs.readFileSync("templates/routes.js", {
    encoding: "utf8",
    flag: "r",
  });
  const routesTemplate = Handlebars.compile(routesSource);
  const icons = extractIconsList(routesData);
  const routesContent = routesTemplate({ layouts: routesData, icons: icons });
  fs.writeFileSync(`${projectName}/src/Data/routes.js`, routesContent);

  // Create the directory structure
  await createDirectoryStructure(projectName);

  await beautifyCode(projectName);

  if (options.noCommit) {
    await createCommit(projectName);
  }
}

async function createViewDirectory({
  routes,
  viewSource,
  viewIndexSource,
  projectName,
  layoutKey,
  allRoutes,
}: {
  routes: any;
  viewSource: string;
  viewIndexSource: string;
  projectName: string;
  layoutKey: string;
  allRoutes: any;
}) {
  return Promise.all(
    Object.keys(routes).map(async (viewKey) => {
      const viewTemplate = await compileTemplate(viewSource, {
        componentKey: viewKey,
        sitemap: routes[viewKey].sitemap,
        title: routes[viewKey].title,
      });
      const viewIndexTemplate = await compileTemplate(viewIndexSource, {
        componentKey: viewKey,
      });

      // Create view directory
      const viewPath = path.join(
        projectName,
        "src",
        "Views",
        camelName(layoutKey),
        viewName(viewKey)
      );
      await createDirectory(viewPath);

      // Insert files
      fs.writeFileSync(
        path.join(viewPath, `${viewName(viewKey)}.jsx`),
        viewTemplate
      );
      fs.writeFileSync(path.join(viewPath, `index.jsx`), viewIndexTemplate);
      fs.closeSync(
        fs.openSync(path.join(viewPath, `${viewName(viewKey)}.module.css`), "w")
      );

      if (routes[viewKey].routes !== undefined) {
        await createViewDirectory({
          routes: routes[viewKey].routes,
          viewSource,
          viewIndexSource,
          projectName,
          layoutKey,
          allRoutes,
        });
      }
    })
  );
}

async function createDirectoryStructure(projectName: string) {
  await Promise.all(
    directoryStructure.map((dir) =>
      createDirectory(path.join(projectName, "src", dir), true)
    )
  );
}

async function initReactProject(projectName: string) {
  try {
    await run("npx", ["create-react-app", projectName]);
  } catch (code) {
    process.exit(-1);
  }
}

async function installProjectDependencies(projectName: string) {
  try {
    await run("npm", ["install"].concat(dependencies), { cwd: projectName });
  } catch (code) {
    process.exit(-1);
  }
}

function showBanner() {
  console.log(
    chalk.red(figlet.textSync("Magic React", { horizontalLayout: "full" }))
  );
}

function run(command: string, args: string[], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.stdout.on("data", (data) => {
      console.log(chalk.blue(data));
    });

    child.stderr.on("data", (data) => {
      console.log(chalk.red(data));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

function compileTemplate(source: string, args: any) {
  const template = Handlebars.compile(source);
  return template(args);
}

function createDirectory(dir: string, notEmpty = false) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (notEmpty) {
    const files = fs.readdirSync(dir);
    if (files.length == 0) {
      fs.writeFileSync(path.join(dir, ".gitkeep"), "");
    }
  }
}

function camelName(name: string) {
  return name[0].toUpperCase() + name.slice(1);
}

function viewName(name: string) {
  return camelName(name) + "View";
}

function layoutName(name: string) {
  return camelName(name) + "Layout";
}

function extractViews(routes: any) {
  const views: string[] = [];
  Object.keys(routes).forEach((viewKey) => {
    views.push(viewName(viewKey));
    if (routes[viewKey].routes !== undefined) {
      views.push(...extractViews(routes[viewKey].routes));
    }
  });
  return views;
}

function generateViewImports(routes: any, layoutKey: string) {
  const views = extractViews(routes);

  return new Handlebars.SafeString(
    views
      .map(
        (view) =>
          `import ${view} from "../Views/${camelName(layoutKey)}/${view}";`
      )
      .join("\n")
  );
}

function generateRoutes(routes: any, isTop = true) {
  const rows: (string | SafeString)[] = [];

  Object.keys(routes).forEach((routeKey) => {
    const newRows: (string | SafeString)[] = [
      `${routeKey}: {`,
      `path: "${routes[routeKey].path}",`,
      `element: <${isTop ? layoutName(routeKey) : viewName(routeKey)} />,`,
    ];

    if (routes[routeKey].title !== undefined) {
      newRows.push(`title: "${routes[routeKey].title}",`);
    }

    if (routes[routeKey].icon !== undefined) {
      newRows.push(`icon: <${routes[routeKey].icon} />,`);
    }

    if (routes[routeKey].routes !== undefined) {
      newRows.push(`routes: {`);
      newRows.push(generateRoutes(routes[routeKey].routes, false));
      newRows.push(`},`);
    }

    newRows.push(`},`);

    rows.push(...newRows);
  });

  return new Handlebars.SafeString(rows.join("\n"));
}

async function beautifyCode(projectName: string) {
  try {
    await run("npx", ["prettier", "--write", "."], { cwd: projectName });
  } catch (code) {
    process.exit(-1);
  }
}

async function createCommit(projectName: string) {
  const git: SimpleGit = simpleGit(projectName, { binary: "git" });
  await git.add("./*").commit("magic react tricks!");
}

function extractIconsList(routes: any) {
  const icons: string[] = [];
  Object.keys(routes).forEach((viewKey) => {
    if (
      routes[viewKey].icon !== undefined &&
      !icons.includes(routes[viewKey].icon)
    ) {
      icons.push(routes[viewKey].icon);
    }
    if (routes[viewKey].routes !== undefined) {
      extractIconsList(routes[viewKey].routes).forEach((icon) => {
        if (!icons.includes(icon)) {
          icons.push(icon);
        }
      });
    }
  });
  return icons;
}

function concatenate(args: any) {
  return new Handlebars.SafeString(args.join(", "));
}
