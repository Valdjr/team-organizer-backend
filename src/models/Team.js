const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Team = new Schema({
    name: {
        type: String,
        required: true
    },
    qtdMinUser: {
        type: Number,
        min: 2,
        default: 2,
        required: true,
    },
    qtdMaxUser: {
        type: Number,
        max: 15, // será necessário determinar um nº máximo?
        default: 5, // será necessário determinar um máximo padrão?
        required: true,
    },
    qtdRoles: {
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: 'roles',
                required: true,
            },
            {
                qtdMin: Number,
                min: 0,
                default: 0,
                required: true,
            },
            {
                qtdMax: Number,
                max: this.qtdMaxUser/2,
                default: 0,
                required: true,
            }
        ],
        required: 'Role amount must be set',
    },
});

mongoose.model('teams', Team);