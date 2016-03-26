'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

let addUserManager = (processObjects) => {
    log('userManager.js\t:Adding User Management Module')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let authCheck = processObjects.ensureAuthenticated
        processObjects.users

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addUserManager }