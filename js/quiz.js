// IT 3203 Milestone 2 - quiz.js - Evan Crawford
// Grades the quiz, runs the 10 minute timer, shows results, and resets the quiz.

// ---------- Answer key ----------
// one object per question:
//   name    = the name used in quiz.html
//   type    = text, radio, select, or checkbox
//   answer  = the correct value(s). For text questions these are all accepted spellings.
//   display = what to show in the results table
const questions = [
  { name: "q1", type: "text", answer: ["transfer"], display: "Transfer" },
  { name: "q2", type: "text", answer: ["404"], display: "404" },
  { name: "q3", type: "text", answer: ["tls"], display: "TLS" },
  { name: "q4", type: "radio", answer: ["HTTP/3"], display: "HTTP/3" },
  { name: "q5", type: "radio", answer: ["Tim Berners-Lee"], display: "Tim Berners-Lee" },
  { name: "q6", type: "radio", answer: ["GET"], display: "GET" },
  { name: "q7", type: "radio", answer: ["Head-of-line blocking"], display: "Head-of-line blocking" },
  { name: "q8", type: "select", answer: ["5xx"], display: "5xx" },
  { name: "q9", type: "checkbox", answer: ["Confidentiality", "Integrity", "Authentication"],
    display: "Confidentiality, Integrity, Authentication" },
  { name: "q10", type: "checkbox", answer: ["Multiplexing", "Header compression", "Binary framing"],
    display: "Multiplexing, Header compression, Binary framing" }
];

const POINTS_PER_QUESTION = 10;
const PASSING_SCORE = 70;      // out of 100
const TIME_LIMIT = 10 * 60;    // 10 minutes in seconds

// ---------- Page elements ----------
const form = document.getElementById("quiz-form");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const timerBox = document.getElementById("timer-box");
const timerText = document.getElementById("timer");
const resultsBox = document.getElementById("results");
const resultRows = document.getElementById("result-rows");

// ---------- Timer variables ----------
let secondsLeft = TIME_LIMIT;
let timerId = null;
let startTime = 0;
let submitted = false;   // stops the quiz from being graded twice

// turns seconds into m:ss, for example 75 -> "1:15"
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds < 10) {
    return minutes + ":0" + seconds;
  }
  return minutes + ":" + seconds;
}

// starts the countdown. setInterval runs the function every 1000 ms (1 second)
function startTimer() {
  secondsLeft = TIME_LIMIT;
  startTime = Date.now();
  timerText.textContent = formatTime(secondsLeft);
  timerBox.classList.remove("warning");

  timerId = setInterval(function () {
    secondsLeft--;
    timerText.textContent = formatTime(secondsLeft);

    // turn the timer red in the last minute
    if (secondsLeft <= 60) {
      timerBox.classList.add("warning");
    }

    // time is up, so submit automatically
    if (secondsLeft <= 0) {
      alert("Time is up! Your quiz will be submitted now.");
      gradeQuiz();
    }
  }, 1000);
}

// ---------- Reading the user's answers ----------
// always returns an array so every question type can be checked the same way
function getUserAnswer(question) {
  if (question.type === "text" || question.type === "select") {
    const value = form.elements[question.name].value.trim();
    if (value === "") {
      return [];
    }
    return [value];
  }

  // radio and checkbox: collect every box that is checked
  const checked = form.querySelectorAll('input[name="' + question.name + '"]:checked');
  const values = [];
  for (let i = 0; i < checked.length; i++) {
    values.push(checked[i].value);
  }
  return values;
}

// ---------- Checking one answer ----------
function isCorrect(question, userAnswer) {
  // text: not case sensitive, any accepted spelling counts
  if (question.type === "text") {
    if (userAnswer.length === 0) {
      return false;
    }
    return question.answer.includes(userAnswer[0].toLowerCase());
  }

  // radio, select, checkbox: must pick exactly the right choices, no extras
  // (for checkboxes this means all correct boxes and no wrong ones)
  if (userAnswer.length !== question.answer.length) {
    return false;
  }
  for (let i = 0; i < userAnswer.length; i++) {
    if (!question.answer.includes(userAnswer[i])) {
      return false;
    }
  }
  return true;
}

// adds one table cell. textContent is used instead of innerHTML so
// anything the user typed is shown as plain text and never run as HTML
function addCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.appendChild(cell);
}

// turns every input on or off (used to lock the quiz after submitting)
function setInputsDisabled(isDisabled) {
  const inputs = form.querySelectorAll("input, select");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].disabled = isDisabled;
  }
  submitBtn.disabled = isDisabled;
}

// ---------- Grading ----------
function gradeQuiz() {
  if (submitted) {
    return;
  }
  submitted = true;
  clearInterval(timerId);

  // time spent in seconds, capped at the time limit
  let timeSpent = Math.round((Date.now() - startTime) / 1000);
  if (timeSpent > TIME_LIMIT) {
    timeSpent = TIME_LIMIT;
  }

  let totalScore = 0;
  resultRows.innerHTML = "";   // clear any old rows

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswer = getUserAnswer(question);
    const correct = isCorrect(question, userAnswer);

    let points = 0;
    if (correct) {
      points = POINTS_PER_QUESTION;
    }
    totalScore += points;

    // color the question box green or red (each fieldset has the id q1-box, q2-box, ...)
    const box = document.getElementById(question.name + "-box");
    if (correct) {
      box.classList.add("correct");
    } else {
      box.classList.add("incorrect");
    }

    // build the results row for this question
    const row = document.createElement("tr");
    if (correct) {
      row.className = "row-correct";
    } else {
      row.className = "row-incorrect";
    }

    let shownAnswer = "(no answer)";
    if (userAnswer.length > 0) {
      shownAnswer = userAnswer.join(", ");
    }

    addCell(row, i + 1);
    addCell(row, correct ? "Correct" : "Incorrect");
    addCell(row, shownAnswer);
    addCell(row, question.display);
    addCell(row, points + " / " + POINTS_PER_QUESTION);
    resultRows.appendChild(row);
  }

  // pass or fail message
  const status = document.getElementById("result-status");
  if (totalScore >= PASSING_SCORE) {
    status.textContent = "PASS";
    status.className = "status pass";
  } else {
    status.textContent = "FAIL";
    status.className = "status fail";
  }

  document.getElementById("result-score").textContent = totalScore + " / 100";
  document.getElementById("result-time").textContent = formatTime(timeSpent) + " (minutes:seconds)";

  // lock the answers, then show the results box and scroll up to it
  setInputsDisabled(true);
  resultsBox.hidden = false;
  resultsBox.scrollIntoView({ behavior: "smooth" });
}

// ---------- Retake / reset ----------
function resetQuiz() {
  clearInterval(timerId);
  form.reset();                 // clears all text, radios, checkboxes, and the dropdown
  setInputsDisabled(false);

  // remove the green/red colors from every question
  const boxes = document.querySelectorAll(".question");
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].classList.remove("correct", "incorrect");
  }

  // hide and empty the results
  resultRows.innerHTML = "";
  resultsBox.hidden = true;

  submitted = false;
  window.scrollTo(0, 0);
  startTimer();
}

// ---------- Event listeners ----------
// preventDefault stops the form from reloading the page
form.addEventListener("submit", function (event) {
  event.preventDefault();
  gradeQuiz();
});

resetBtn.addEventListener("click", resetQuiz);

// start the timer when the page loads
startTimer();