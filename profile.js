<!DOCTYPE html>
<html>
<head>
  <title>MCN Engine Profile</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="style.css">

  <style>
    body {
      margin: 0;
      font-family: Arial;
      background: #0b132b;
      color: white;
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1c2541;
      padding: 10px;
    }

    .icon-btn {
      background: #5bc0be;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }

    #dropdownMenu {
      display: none;
      padding: 10px;
      background: #1c2541;
      margin: 10px;
      border-radius: 10px;
    }

    /* MONITOR */
    .monitor {
      background: #000;
      color: #fff;
      font-size: 13px;
      height: 120px;
      overflow-y: auto;
      font-family: monospace;
      padding: 10px;
      border-radius: 12px;
      margin: 10px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      background: #1c2541;
      margin: 10px;
      padding: 10px;
      border-radius: 12px;
      animation: glow 2s infinite alternate;
    }

    @keyframes glow {
      from { box-shadow: 0 0 5px #5bc0be; }
      to { box-shadow: 0 0 15px #5bc0be; }
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #5bc0be;
    }

    .username {
      margin-left: 10px;
      color: #5bc0be;
      font-weight: bold;
    }

    .card {
      background: #1c2541;
      margin: 10px;
      padding: 10px;
      border-radius: 12px;
    }

    /* CHAT INPUT */
    .chat-row {
      display: flex;
      gap: 6px;
      margin: 10px;
    }

    .chat-row input {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: none;
    }

    .chat-row button {
      width: 80px;
      border-radius: 8px;
      border: none;
      background: #5bc0be;
      font-weight: bold;
    }

    .popup {
      display: none;
      position: fixed;
      top: 20%;
      left: 10%;
      right: 10%;
      background: #1c2541;
      padding: 12px;
      border-radius: 12px;
    }

    /* 🔥 ONLINE USERS ROW FIX */
    .user-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f1a2e;
      padding: 8px;
      border-radius: 8px;
      margin-bottom: 6px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .online-dot {
      width: 8px;
      height: 8px;
      background: #00ff88;
      border-radius: 50%;
    }

    .user-actions {
      display: flex;
      flex-direction: row;
      gap: 6px;
    }

    .small-btn {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 6px;
      border: none;
      background: #5bc0be;
      cursor: pointer;
      white-space: nowrap;
    }
  </style>
</head>

<body>

<div class="navbar">
  <button class="icon-btn" onclick="location.href='dashboard.html'">Back</button>
  <h3>Profile</h3>
  <button class="icon-btn" onclick="toggleMenu()">☰</button>
</div>

<div id="dropdownMenu">
  <h4 id="usernameDisplay">Loading...</h4>

  <input id="usernameInput" placeholder="New username">
  <button onclick="updateUsername()">Save Username</button>

  <button onclick="resetPassword()">Reset Password</button>

  <hr>

  <button onclick="openRequests()">👥 Requests</button>
  <button onclick="openFriends()">👤 Friends</button>
</div>

<!-- MONITOR -->
<div id="monitor" class="monitor">
  [SYSTEM] Profile monitor started...
</div>

<!-- CHAT -->
<div class="chat-row">
  <input id="chatInput" placeholder="Type message...">
  <button onclick="sendChat()">Send</button>
</div>

<div class="profile-header">
  <div class="avatar"></div>
  <div class="username">User Panel</div>
</div>

<!-- 🔥 ONLINE USERS (INJECTED) -->
<div class="card">
  <h4>🟢 Online Users</h4>
  <div id="onlineUsers"></div>
</div>

<div id="requestsPopup" class="popup">
  <h4>Friend Requests</h4>
  <div id="friendRequestsBox"></div>
  <button onclick="closePopup('requestsPopup')">Close</button>
</div>

<div id="friendsPopup" class="popup">
  <h4>Friends</h4>
  <div id="friendsBox"></div>
  <button onclick="closePopup('friendsPopup')">Close</button>
</div>

<div class="card">
  <h4>📊 Activity Overview</h4>
  <p>Ad Status: <b id="adStatus">No active ads</b></p>
  <p>
    Messages: 
    <b id="msgCount">0</b>
    <span id="msgBadge" style="margin-left:6px;"></span>
  </p>
</div>

<script type="module" src="profile.js"></script>

<script>
function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function (e) {
  const menu = document.getElementById("dropdownMenu");
  if (menu.style.display === "block" &&
      !menu.contains(e.target) &&
      !e.target.classList.contains("icon-btn")) {
    menu.style.display = "none";
  }
});
</script>

</body>
</html>