class Notifier {
    notify(listOfChanges) {
        for(let i = 0; i < listOfChanges.length; i++) {
            const { url, changes } = listOfChanges[i];
        }
        // render email template
        // fetch users to email from db
        // send emails
    }
}

module.exports = Notifier;