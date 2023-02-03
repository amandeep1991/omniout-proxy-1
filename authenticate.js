import fetch from 'node-fetch';

/************** START: EDIT THIS *******************/
const authenticationUrl = process.env.AUTH_URL;
const authenticationUsername = process.env.AUTH_USERNAME;
const authenticationPassword = process.env.AUTH_PASSWORD;
const authenticationInterval = process.env.AUTH_INTERVAL;
const authenticationClientId = process.env.AUTH_CLIENT_ID;
const authenticationClientSecret = process.env.AUTH_CLIENT_SECRET;
/************** END: EDIT THIS *******************/
console.log('####################1.1');
let instanceUrl = '';
let accessToken = '';
let authenticated = false;

/************** DO NOT USE IN PRODUCTION *************/
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
console.log('####################1.2');
async function authenticate() {
    try {
        authenticated = false;
        const response = await fetch(authenticationUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${authenticationUsername}&password=${authenticationPassword}&client_id=${authenticationClientId}&client_secret=${authenticationClientSecret}&grant_type=password`
        });

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (err) {
        console.log(err);
    }
}
console.log('####################1.3');
export function runAuthenticate() {
    authenticate().then((result) => {
        if (result) {
            authenticated = true;
            accessToken = result.access_token;
            instanceUrl = result.instance_url;
            console.log("Access token and instance url retrieved.");
            setTimeout(runAuthenticate, authenticationInterval);
        }
    });
}
console.log('####################1.4');
export function getAuthenticationDetails() {
    return {
        instanceUrl,
        accessToken,
        authenticated
    }
}
console.log('####################1.5');
