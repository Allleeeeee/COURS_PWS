const { Users, Managers, Theatres } = require('../models/models.js');  
const bcrypt = require('bcrypt');  
const { v4: uuidv4 } = require('uuid'); 
const ApiError = require('../exceptions/apierror.js');
const MailService = require('./MailService.js');
const TokenService = require('./TokenService.js')
const UserDto = require('../dto/UserDto.js')

class ManagerServise{
    async addManager(email, password, name, surname, phoneNumber, theatreId, addInfo) {
        const candidateUser = await Users.findOne({ where: { Email: email } });
        const candidateManager = await Managers.findOne({where : {Phone_number: phoneNumber}});
        
        if(candidateUser) {
            throw ApiError.BadRequest(`Пользователь с email ${email} уже существует, выберите другой email.`);
        }
        if(candidateManager) {
            throw ApiError.BadRequest(`Пользователь с телефоном ${phoneNumber} уже существует, выберите другой телефон.`);
        }
        
        const hashpass = await bcrypt.hash(password, 3);
        const activationLink = uuidv4();
        
        // Создаем пользователя
        const user = await Users.create({ 
            Email: email, 
            Password: hashpass, 
            Name: name, 
            Surname: surname, 
            Role: 'manager'
        });
        
        // console.log(`${process.env.API_URL}/api/activate/${activationLink}`);
        // await MailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
        
        // Создаем менеджера
        const manager = await Managers.create({
            User_id: user.ID,
            Theatre_id: theatreId, 
            Phone_number: phoneNumber,
            Additional_info: addInfo
        });
        
        // Возвращаем только информацию о созданном менеджере, без токенов
        return {
            manager: {
                id: manager.ID,
                userId: user.ID,
                theatreId: manager.Theatre_id,
                phone: manager.Phone_number,
                info: manager.Additional_info
            },
            user: {
                id: user.ID,
                email: user.Email,
                name: user.Name,
                surname: user.Surname,
                role: user.Role
            }
        };
    }

    async delManager(id) {
        const manager = await Managers.findOne({ where: { Manager_id: id } });
        if (!manager) {
            throw ApiError.BadRequest(`Менеджер с ID ${id} не найден.`);
        }
        await manager.destroy();
        const user = await Users.findOne({ where: { ID: manager.User_id } });
        if (user) {
            await user.destroy();
        }
        return { message: `Менеджер с ID ${id} успешно удалён.` };
    }
    async updateManager(managerId, email, password, name, surname, phoneNumber, theatreId, addInfo) {
        const manager = await Managers.findByPk(managerId);
        if (!manager) {
            throw ApiError.BadRequest(`Менеджер не найден.`);
        }

        const user = await Users.findByPk(manager.User_id);
        if (!user) {
            throw ApiError.BadRequest(`Пользователь с ID ${managerId} не найден.`);
        }

        if (email && email !== user.Email) {
            const existingUser = await Users.findOne({ where: { Email: email } });
            if (existingUser) {
                throw ApiError.BadRequest(`Пользователь с email ${email} уже существует.`);
            }
            user.Email = email;
            // const newActivationLink = uuidv4();
            // console.log(`${process.env.API_URL}/api/activate/${newActivationLink}`);
            // await MailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${newActivationLink}`);
            // user.isActive = false;
        }
        if (password && typeof password === "string" && password.trim() !== "") {
            user.Password = await bcrypt.hash(password, 3);
            console.log(user.Password);
        }
        if (name) user.Name = name;
        if (surname) user.Surname = surname;
    
        await user.save();
        if (phoneNumber) manager.Phone_number = phoneNumber;
        if (theatreId) manager.Theatre_id = theatreId;
        if (addInfo) manager.Additional_info = addInfo;
        await manager.save();
        return { message: `Менеджер с ID ${managerId} успешно обновлён.` };
    }

    async getAllManagers() {
        const managers = await Managers.findAll({
            include: [
                {
                    model: Users,
                    as: "User",
                    attributes: ['Name', 'Surname', 'Email'] 
                }
            ]
        });
        return managers;
    }

    async getManagerByUserId(id){
        const user = await Users.findOne({
            where: { ID: id },
            attributes: ['ID', 'Email', 'Name', 'Surname', 'Password'],
            include: [
              {
                model: Managers,
                attributes: ['Manager_id', 'Phone_number', 'Theatre_id', 'Additional_info']
              }
            ]
          });
      
          if (!user || !user.Manager) {
            return res.status(404).json({ message: 'Менеджер или пользователь не найден' });
          }
          
          const managerData = {
            managerId: user.Manager.Manager_id,
            email: user.Email,
            password: bcrypt.hash(user.Password,3), 
            name: user.Name,
            surname: user.Surname,
            phoneNumber: user.Manager.Phone_number || "",
            theatreId: user.Manager.Theatre_id,
            addInfo: user.Manager.Additional_info || ""
          };
          return managerData;
};

async getTheatreByManager(managerId) {
    try {
        const manager = await Managers.findOne({where:{User_id:managerId}});
        if (!manager) {
            throw new Error('Менеджер не найден');
        }
        
        const theatre = await Theatres.findByPk(manager.Theatre_id);
        if (!theatre) {
            throw new Error('Театр не найден');
        }
        
        return theatre;
    } catch (error) {
        console.error('Ошибка при получении театра менеджера:', error);
        throw error;
    }
};

}

module.exports = new ManagerServise();