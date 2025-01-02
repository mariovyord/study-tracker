import fs from "fs";
import inquirer from "inquirer";
import chalk from "chalk";

const dataFile = "./study-tracker.json";

// Load KPIs from file
function loadKPIs() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
  }
  const data = fs.readFileSync(dataFile);
  return JSON.parse(data);
}
function saveKPIs(kpis) {
  fs.writeFileSync(dataFile, JSON.stringify(kpis, null, 2));
}

async function addGoal() {
  const existingKPIs = loadKPIs();

  const { title, weeklyGoal, weeks } = await inquirer.prompt([
    {
      name: "title",
      message: "Enter your goal title:",
      type: "input",
      validate: (input) => {
        if (!input) {
          return "Title cannot be empty.";
        }
        if (existingKPIs.find((kpi) => kpi.title === input)) {
          return "A goal with this title already exists.";
        }
        return true;
      },
    },
    {
      name: "weeklyGoal",
      message: "Enter weekly study goal (hours):",
      type: "input",
      validate: (input) => {
        const number = parseFloat(input);
        if (isNaN(number)) {
          return "Weekly goal should be a number.";
        }
        if (number <= 0) {
          return "Weekly goal should be a positive number.";
        }
        return true;
      },
    },
    {
      name: "weeks",
      message: "Enter duration of goal (weeks):",
      type: "input",
      validate: (input) => {
        const number = parseFloat(input);
        if (isNaN(number)) {
          return "Duration should be a number.";
        }
        if (number <= 0) {
          return "Duration should be a positive number.";
        }
        return true;
      },
    },
  ]);

  const totalGoal = parseFloat(weeklyGoal) * parseFloat(weeks);
  const kpis = loadKPIs();
  kpis.push({
    title,
    weeklyGoal: parseFloat(weeklyGoal),
    weeks: parseFloat(weeks),
    totalGoal,
    progress: 0,
    sessions: [],
  });
  saveKPIs(kpis);
  console.log(chalk.green("Goal added successfully!"));
}

async function logSession() {
  const kpis = loadKPIs();
  if (kpis.length === 0) {
    console.log(chalk.yellow("No goals found. Add a goal first."));
    return;
  }

  const { index, hours } = await inquirer.prompt([
    {
      name: "index",
      message: "Select the goal to log progress:",
      type: "list",
      choices: kpis.map((kpi, i) => `${i + 1}. ${kpi.title}`),
    },
    {
      name: "hours",
      message: "Enter hours studied:",
      type: "input",
      validate: (input) => {
        const number = parseFloat(input);
        if (isNaN(number)) {
          return "Hours should be a number.";
        }
        if (number <= 0) {
          return "Hours should be a positive number.";
        }
        return true;
      },
    },
  ]);

  const kpiIndex = parseInt(index.split(".")[0]) - 1;
  const kpi = kpis[kpiIndex];

  kpi.sessions.push(parseFloat(hours));
  kpi.progress = kpi.sessions.reduce((total, session) => total + session, 0);

  saveKPIs(kpis);
  console.log(chalk.green("Session logged successfully!"));
}

function viewProgress() {
  const kpis = loadKPIs();
  if (kpis.length === 0) {
    console.log(chalk.yellow("No goals found."));
    return;
  }

  kpis.forEach((kpi, index) => {
    const percentage = ((kpi.progress / kpi.totalGoal) * 100).toFixed(2);
    console.log(chalk.cyan(`\n${index + 1}. ${kpi.title}`));
    console.log(`Weekly Goal: ${kpi.weeklyGoal} hours`);
    console.log(`Total Goal: ${kpi.totalGoal} hours`);
    console.log(`Progress: ${kpi.progress} hours (${percentage}%)`);
    console.log(generateProgressBar(percentage));
    console.log(
      "Sessions:",
      kpi.sessions.join(", ") || "No sessions logged yet."
    );
  });
}

function generateProgressBar(percentage, width = 20) {
  const filledLength = Math.round((percentage / 100) * width);
  const bar = "█".repeat(filledLength) + "░".repeat(width - filledLength);
  return `[${bar}] ${percentage}%`;
}

async function mainMenu() {
  const { action } = await inquirer.prompt([
    {
      name: "action",
      message: "What do you want to do?",
      type: "list",
      choices: [
        "Add a new goal",
        "Log a study session",
        "View progress",
        "Exit",
      ],
    },
  ]);

  switch (action) {
    case "Add a new goal":
      await addGoal();
      break;
    case "Log a study session":
      await logSession();
      break;
    case "View progress":
      viewProgress();
      break;
    case "Exit":
      console.log(chalk.blue("Goodbye!"));
      process.exit();
  }

  // Loop back to the main menu
  mainMenu();
}

// Start the tool
mainMenu();
