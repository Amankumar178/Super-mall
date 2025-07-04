function logAction(action, data = {}) {
    const logEntry = {
        action,
        user: firebase.auth().currentUser ? firebase.auth().currentUser.email : "guest",
        timestamp: new Date().toISOString(),
        ...data
    };

    console.log(logEntry); // Console log

    firebase.firestore().collection("logs").add(logEntry)
        .then(() => console.log("Log saved"))
        .catch(err => console.error("Log error:", err));
}
