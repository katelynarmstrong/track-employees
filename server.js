const express = require("express");
const mysql = require("mysql2");
const db = require("./db/connection");
const consoleTable = require("console.table");
const inquirer = require("inquirer");

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Default response for any other request (Not Found)
app.use((req, res) => {
  res.status(404).end();
});

initialPrompt();

function initialPrompt() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "What would you like to do?",
        name: "choice",
        choices: [
          "View All Employees",
          "View All Employees by Department",
          "View All Departments",
          "View All Roles",
          "Update Employee Role",
          "Update Employee Manager",
          "Add Employee",
          "Add Role",
          "Add Department",
          "Delete Employee",
          "Delete Role",
          "Delete Department",
          "Quit",
        ],
      },
    ])
    .then(function (answer) {
      switch (answer.choice) {
        case "View All Employees":
          viewEmployees();
          break;

        case "View All Employees by Department":
          viewEmployeesByDepartment();
          break;

        case "View All Departments":
          viewDepartments();
          break;

        case "View All Roles":
          viewRoles();
          break;

        case "Update Employee Role":
          updateEmployee();
          break;

        case "Update Employee Manager":
          updateEmployeeManager();
          break;

        case "Add Employee":
          addEmployee();
          break;

        case "Add Role":
          addRole();
          break;

        case "Add Department":
          addDepartment();
          break;

        case "Delete Employee":
          deleteEmployee();
          break;

        case "Delete Role":
          deleteRole();
          break;

        case "Delete Department":
          deleteDepartment();
          break;

        case "Quit":
          db.end();
          break;
      }
    });
}
// VIEW ALL SECTIONS

// view all employees
function viewEmployees() {
  sql = `SELECT * FROM employees`;
  db.query(sql, function (err, res) {

    console.log("Employees:");
    console.table(res);
    initialPrompt();
  });
}
// view all employees by department
function viewEmployeesByDepartment() {
  let sql = `SELECT * FROM employees`;

  db.query(sql, function (err, res) {
    if (err) throw err;

    console.log("Employees by Department:");
    console.table(res);
    initialPrompt();
  });
}
// view all roles
function viewRoles() {
  let sql = `SELECT * FROM role`;

  db.query(sql, function (err, res) {
    if (err) throw err;

    console.log("Roles:");
    console.table(res);
    initialPrompt();
  });
}
// view all departments
function viewDepartments() {
  let sql = `SELECT * FROM department`;

  db.query(sql, function (err, res) {
    if (err) throw err;

    console.log("Departments: ");
    console.table(res);
    initialPrompt();
  });
}

// ADDS

// add new employee
function addEmployee() {
  inquirer
    .prompt([
      {
        name: "firstName",
        type: "input",
        message: "What is the first name of this new employee?",
      },
      {
        name: "lastName",
        type: "input",
        message: "What is the last name of this new employee?",
      },
    ])
    .then((answer) => {
      const params = [answer.firstName, answer.lastName];

      let roleSql = `SELECT * FROM role`;
      db.query(roleSql, (err, data) => {

        const roles = data.map(({ id, title }) => ({ name: title, value: id }));
        inquirer
          .prompt([
            {
              name: "role",
              type: "list",
              message: "What is the new employee's role?",
              choices: roles,
            },
          ])
          .then((roleChoice) => {
            const role = roleChoice.role;
            params.push(role);

            const managerSql = `SELECT * FROM employees`;
            db.query(managerSql, (err, data) => {
              const managers = data.map(({ id, first_name, last_name }) => ({
                name: first_name + " " + last_name,
                value: id,
              }));
              inquirer
                .prompt([
                  {
                    name: "manager",
                    type: "list",
                    message: "Who will be this employee's manager?",
                    choices: managers,
                  },
                ])
                .then((managerChocie) => {
                  const manager = managerChocie.manager;
                  params.push(manager);

                  let sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                                      VALUES (?,?,?,?)`;
                  db.query(sql, params, (err) => {
                    if (err) throw err;
                    viewEmployees();
                  });
                });
            });
          });
      });
    });
}
// add role to database
function addRole() {
  const deptSql = `SELECT * FROM departments`;
  db.query(deptSql, (err, res) => {
    if (err) throw err;

    let deptNames = [];

    res.forEach((department) => {
      deptNames.push(department.department_name);
    });

    inquirer
      .prompt([
        {
          name: "departmentName",
          type: "list",
          message: "What department does this new role belong to?",
          choices: deptNames,
        },
      ])
      .then((answer) => {
        addRoleContinue(answer);
      });

    const addRoleContinue = (departmentData) => {
      inquirer
        .prompt([
          {
            name: "newRole",
            type: "input",
            message: "What is the title of the new role?",
          },
          {
            name: "salary",
            type: "input",
            message: "How much salary does this new role earn?",
          },
        ])
        .then((answer) => {
          let newRole = answer.newRole;
          let departmentId;

          res.forEach((department) => {
            if (departmentData.departmentName === department.department_name) {
              departmentId = department.id;
            }
          });

          let sql = `INSERT INTO roles (title, salary, department_id) VALUES (?,?,?)`;
          let params = [newRole, answer.salary, departmentId];

          db.query(sql, params, (err) => {
            if (err) throw err;

            viewRoles();
          });
        });
    };
  });
}
// add department to database
function addDepartment() {
  inquirer
    .prompt([
      {
        name: "newDepartment",
        type: "input",
        message: "What is the name of the department?",
      },
    ])
    .then((answer) => {
      db.query(
        `INSERT INTO departments (department_name) VALUES (?)`,
        answer.newDepartment,
        (err, res) => {
          if (err) throw err;

          console.log("Added " + answer.addDepartment + "to departments.");
          viewDepartments();
        }
      );
    });
}

// UPDATES

// update an employee's role
function updateEmployee() {
  let sql = `SELECT employees.id, employees.first_name, employees.last_name, roles.id AS "role_id"
              FROM employees, roles, departments WHERE departments.id = roles.department_id AND roles.id = employees.role_id`;

  db.query(sql, (err, response) => {

    let employeeArray = [];
    response.forEach((employee) => {
      employeeArray.push(`${employee.first_name} ${employee.last_name}`);
    });

    let sql = `SELECT roles.id, roles.title FROM roles`;
    db.query(sql, (err, res) => {
      let rolesArray = [];
      res.forEach((role) => {
        rolesArray.push(role.title);
      });

      inquirer
        .prompt([
          {
            name: "chosenEmployee",
            type: "list",
            message: "Which employee has a new role?",
            choices: employeeArray,
          },
          {
            name: "chosenRole",
            type: "list",
            message: "What is their new role?",
            choices: rolesArray,
          },
        ])
        .then((answer) => {
          let newTitleId, employeeId;

          res.forEach((role) => {
            if (answer.chosenRole === role.title) {
              newTitleId = role.id;
            }
          });

          response.forEach((employee) => {
            if (
              answer.chosenEmployee ===
              `${employee.first_name} ${employee.last_name}`
            ) {
              employeeId = employee.id;
            }
          });

          let sqls = `UPDATE employees SET employees.role_id = ? WHERE employees.id = ?`;
          db.query(sqls, [newTitleId, employeeId], (err) => {
            if (err) throw err;
            console.log("Employee Role Updated.");
            viewEmployees();
          });
        });
    });
  });
}

function updateEmployeeManager() {
  let sql = `SELECT employees.id, employees.first_name, employees.last_name, employees.manager_id
              FROM employees`;

  db.query(sql, (err, res) => {
    let employeeArray = [];
    res.forEach((employee) => {
      employeeArray.push(`${employee.first_name} ${employee.last_name}`);
    });

    inquirer
      .prompt([
        {
          name: "chosenEmployee",
          type: "list",
          message: "Which employee has a new manager?",
          choices: employeeArray,
        },
        {
          name: "newManager",
          type: "list",
          message: "Who is the manager?",
          choices: employeeArray,
        },
      ])
      .then((answer) => {
        let employeeId, managerId;
        res.forEach((employee) => {
          if (
            answer.chosenEmployee ===
            `${employee.first_name} ${employee.last_name}`
          ) {
            employeeId = employee.id;
          }

          if (
            answer.newManager === `${employee.first_name} ${employee.last_name}`
          ) {
            managerId = employee.id;
          }
        });

        if (answer.chosenEmployee === answer.newManager) {
          console.log("Invalid Manager Selection");
          initialPrompt();
        } else {
          let sql = `UPDATE employees SET employees.manager_id = ? WHERE employees.id = ?`;

          db.query(sql, [managerId, employeeId], (err) => {
            if (err) throw err;

            console.log("Updated Employee Manager");
            initialPrompt();
          });
        }
      });
  });
}

// DELETES

// delete an employee
function deleteEmployee() {
  let sql = `SELECT employees.id, employees.first_name, employees.last_name FROM employees`;

  db.query(sql, (err, res) => {
    if (err) throw err;

    let employeeNamesArray = [];
    res.forEach((employee) => {
      employeeNamesArray.push(`${employee.first_name} ${employee.last_name}`);
    });

    inquirer
      .prompt([
        {
          name: "chosenEmployee",
          type: "list",
          message: "Which employee would you like to delete?",
          choices: employeeNamesArray,
        },
      ])
      .then((answer) => {
        let employeeId;

        res.forEach((employee) => {
          if (
            answer.chosenEmployee ===
            `${employee.first_name} ${employee.last_name}`
          ) {
            employeeId = employee.id;
          }
        });

        let sql = `DELETE FROM employees WHERE employees.id = ?`;
        db.query(sql, [employeeId], (err) => {
          if (err) throw err;

          console.log("Employee Sucessfully Deleted.");
          viewEmployees();
        });
      });
  });
}

// delete a role
function deleteRole() {
  let sql = `SELECT roles.id, roles.title FROM roles`;

  db.query(sql, (err, res) => {
    if (err) throw err;

    let rolesArray = [];
    res.forEach((role) => {
      rolesArray.push(role.title);
    });

    inquirer
      .prompt([
        {
          name: "chosenRole",
          type: "list",
          message: "Which role would you like to remove?",
          choices: rolesArray,
        },
      ])
      .then((answer) => {
        let roleId;

        res.forEach((role) => {
          if (answer.chosenRole === role.title) {
            roleId = role.id;
          }
        });

        let sql = `DELETE FROM roles WHERE roles.id = ?`;
        db.query(sql, [roleId], (err) => {
          if (err) throw err;

          console.log("Role Successfully Deleted.");
          viewRoles();
        });
      });
  });
}

// delete a department
function deleteDepartment() {
  let sql = `SELECT departments.id, departments.department_name FROM departments`;
  db.query(sql, (err, res) => {
    if (err) throw err;

    let departmentArray = [];
    res.forEach((department) => {
      departmentArray.push(department.department_name);
    });

    inquirer
      .prompt([
        {
          name: "chosenDept",
          type: "list",
          message: "Which department would you like to delete?",
          choices: departmentArray,
        },
      ])
      .then((answer) => {
        let departmentId;

        res.forEach((department) => {
          if (answer.chosenDept === department.department_name) {
            departmentId = department.id;
          }
        });

        let sql = `DELETE FROM departments WHERE departments.id = ?`;
        db.query(sql, [departmentId], (err) => {
          if (err) throw err;

          console.log("Department Successfully Deleted.");
          viewDepartments();
        });
      });
  });
}
