const C = require('./Constants');
const roles = {
    commissioner: [C.COMMISSIONER],
    police: [C.COMMISSIONER, C.POLICE],
    prisoner: [C.COMMISSIONER, C.POLICE, C.PRISONER],
}


module.exports = roles;
