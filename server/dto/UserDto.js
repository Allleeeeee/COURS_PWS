module.exports = class UserDto{
    email;
    id;
    role;

    constructor(model){
        this.email = model.Email;
        this.id = model.ID;
        this.role = model.Role;

    }
}
