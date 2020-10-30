'use strict'

class User {
    constructor(user) {
        this.id = user.id;
        this.name = user.name;
        this.surname = user.surname;
        this.identificationNumber = user.identificationNumber;
        this.password = user.password;
        this.role = user.role;
        this.phone = user.phone;
        this.studies = user.studies;
        this.salary = user.salary;
        this.entryDate = user.entryDate;
        this.departureDate = user.departureDate;
    }
}