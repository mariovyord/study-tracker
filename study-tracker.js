#!/usr/bin/env node

import fs from "fs";
import inquirer from "inquirer";
import chalk from "chalk";

const dataFile = "./study-tracker.json";

class KPI {
  constructor(title, weeklyGoal, weeks) {
    this.title = title;
    this.weeklyGoal = parseFloat(weeklyGoal);
    this.weeks = parseInt(weeks, 10);
    this.totalGoal = this.weeklyGoal * this.weeks;
    this.progress = 0;
    this.sessions = [];
  }

  addSession(hours) {
    this.sessions.push(parseFloat(hours));
    this.progress = this.sessions.reduce(
      (total, session) => total + session,
      0
    );
  }

  getOverallProgress() {
    return ((this.progress / this.totalGoal) * 100).toFixed(2);
  }
}

function loadKPIs() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
  }
  const data = JSON.parse(fs.readFileSync(dataFile));
  return data.map((kpi) => Object.assign(new KPI(), kpi));
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
        if (
          existingKPIs.some(
            (kpi) => kpi.title.toLowerCase() === input.toLowerCase()
          )
        ) {
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

  const kpis = loadKPIs();
  kpis.push(new KPI(title, weeklyGoal, weeks));
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
  kpi.addSession(hours);

  saveKPIs(kpis);
  console.log(chalk.green(`Logged ${hours} hours for "${kpi.title}".`));
  if (kpi.progress >= kpi.totalGoal) {
    console.log(chalk.blue("🎉 Congratulations! You’ve achieved your goal!"));
  }
}

async function deleteGoal() {
  const kpis = loadKPIs();
  if (kpis.length === 0) {
    console.log(chalk.yellow("No goals found to delete."));
    return;
  }

  const { index } = await inquirer.prompt([
    {
      name: "index",
      message: "Select the goal to delete:",
      type: "list",
      choices: kpis.map((kpi, i) => `${i + 1}. ${kpi.title}`),
    },
  ]);

  const kpiIndex = parseInt(index.split(".")[0]) - 1;
  const deletedGoal = kpis.splice(kpiIndex, 1)[0];
  saveKPIs(kpis);
  console.log(chalk.red(`Deleted goal "${deletedGoal.title}".`));
}

function viewProgress() {
  const kpis = loadKPIs();
  if (kpis.length === 0) {
    console.log(chalk.yellow("No goals found."));
    return;
  }

  kpis.forEach((kpi, index) => {
    const percentage = kpi.getOverallProgress();
    console.log(chalk.cyan(`\n${index + 1}. ${kpi.title}`));
    console.log(`Weekly Goal: ${kpi.weeklyGoal} hours`);
    console.log(`Total Goal: ${kpi.totalGoal} hours`);
    console.log(`Progress: ${kpi.progress} hours (${percentage}%)`);
    console.log(generateProgressBar(percentage));
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
        "Delete a goal",
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
    case "Delete a goal":
      await deleteGoal();
      break;
    case "Exit":
      console.log(chalk.blue("Goodbye!"));
      process.exit();
  }

  mainMenu();
}

// Start the tool
mainMenu();
