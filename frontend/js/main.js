const API_URL = 'http://localhost:5000/api';

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function renderNavbar() {
  const user = getUser();
  let links = `
    <a class="nav-link" href="index.html">Home</a>
    <a class="nav-link" href="services.html">Services</a>`;
  let rightSide = '';

  if (user) {
    links += `<a class="nav-link" href="my-bookings.html">My Bookings</a>`;
    rightSide = `
      <span class="navbar-text me-3">Hello, ${user.name}</span>
      <button class="btn btn-outline-light btn-sm" onclick="logout()">Logout</button>`;
  } else {
    rightSide = `
      <a class="btn btn-outline-light btn-sm me-2" href="login.html">Login</a>
      <a class="btn btn-light btn-sm" href="register.html">Register</a>`;
  }

  document.getElementById('navbar').innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="index.html">💇‍♀️ Glow Salon</a>
        <div class="navbar-nav me-auto">${links}</div>
        <div class="d-flex align-items-center">${rightSide}</div>
      </div>
    </nav>`;
}

// Show a message box on the page
function showMessage(elementId, text, type) {
  document.getElementById(elementId).innerHTML =
    `<div class="alert alert-${type}">${text}</div>`;
}

// Send the user to the login page if they are not logged in
function requireLogin() {
  if (!getToken()) {
    alert('Please log in first');
    window.location.href = 'login.html';
  }
}