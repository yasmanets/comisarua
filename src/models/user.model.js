'use strict'

class User {
    constructor(user) {
        this.id = user.id;
        this.name = user.name;
        this.surname = user.surname;
        this.identificationNumber = user.identificationNumber;
        this.password = user.password;
        this.roleId = user.roleId;
        this.phone = user.phone;
        this.studies = user.studies;
        this.salary = user.salary;
        this.entryDate = user.entryDate;
        this.departureDate = user.departureDate;
    }
}

module.exports = User;
