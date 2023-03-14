import Citas from './classes/Citas.js'
import UI from './classes/UI.js'
import { mascotaInput, propietarioInput, telefonoInput, fechaInput, horaInput, sintomasInput, formulario} from './selectores.js';

// Variable global que hará referencia a la Base de Datos (Data Base)
export let DB;

const administrarCitas = new Citas();
const ui = new UI(administrarCitas);

const citaObj = {
    mascota: '',
    propietario: '',
    telefono: '',
    fecha: '',
    hora:'',
    sintomas: ''
}


let editando = false;

export function datosCita(e) {
    //  console.log(e.target.name) // Obtener el Input
     citaObj[e.target.name] = e.target.value;
}



export function nuevaCita(e) {
    e.preventDefault();

    const { mascota, propietario, telefono, fecha, hora, sintomas } = citaObj;

    // Validar
    if (mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === '') {
        ui.imprimirAlerta('Todos los mensajes son Obligatorios', 'error');
        return;
    }

    if (editando) {
        // Estamos editando
        administrarCitas.editarCita({ ...citaObj });

        // Editar en IndexedDB
        const transaction = DB.transaction(['citas'], 'readwrite');
        const objectStore = transaction.objectStore('citas');
        objectStore.put(citaObj);
        transaction.oncomplete = () => {

            ui.imprimirAlerta('Guardado Correctamente');

            formulario.querySelector('button[type="submit"]').textContent = 'Crear Cita';

            editando = false;
        }
        transaction.onerror = () => {
            console.log('Hubo un error al editar la base de datos');
        }


    } else {
        // Nuevo Registo

        // Generar un ID único
        citaObj.id = Date.now();

        // Añade la nueva cita
        administrarCitas.agregarCita({ ...citaObj });


        // Insertar registro en el IndexedDB 'citas'

        // Crear transacción de la Base de Datos 'citas'
        const transaction = DB.transaction(['citas'], 'readwrite');

        // Vincular la transacción con el almacén de objetos de la base de datos 'citas'
        const objectStore = transaction.objectStore('citas');
        // Agregar el objeto al almacén de objetos
        objectStore.add(citaObj);

        // Definir lo que sucede después de completar o fallar la transacción
        transaction.oncomplete = function () {
            console.log('transacción completada');
            // Mostrar mensaje de que todo esta bien...
            ui.imprimirAlerta('Se agregó correctamente')
        }
        transaction.onerror = function () {
            console.log('transacción errónea');
        }
    }


    // Imprimir el HTML de citas
    ui.imprimirCitas();

    // Reinicia el objeto para evitar futuros problemas de validación
    reiniciarObjeto();

    // Reiniciar Formulario
    formulario.reset();

}



export function reiniciarObjeto() {
    // Reiniciar el objeto
    citaObj.mascota = '';
    citaObj.propietario = '';
    citaObj.telefono = '';
    citaObj.fecha = '';
    citaObj.hora = '';
    citaObj.sintomas = '';
}



export function eliminarCita(id) {
    const transaction = DB.transaction(['citas'], 'readwrite');
    const objectStore = transaction.objectStore('citas');

    objectStore.delete(id);

    transaction.oncomplete = () => {
        console.log(`Cita ${id} eliminada correctamente.`);
        ui.imprimirCitas();
    }

    transaction.onerror = () => {
        console.log(`Hubo un error tratando de eliminar la cita ${id}`);
    }
}



export function cargarEdicion(cita) {

    const {mascota, propietario, telefono, fecha, hora, sintomas, id } = cita;

    // Reiniciar el objeto
    citaObj.mascota = mascota;
    citaObj.propietario = propietario;
    citaObj.telefono = telefono;
    citaObj.fecha = fecha
    citaObj.hora = hora;
    citaObj.sintomas = sintomas;
    citaObj.id = id;

    // Llenar los Inputs
    mascotaInput.value = mascota;
    propietarioInput.value = propietario;
    telefonoInput.value = telefono;
    fechaInput.value = fecha;
    horaInput.value = hora;
    sintomasInput.value = sintomas;

    formulario.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';

    editando = true;

}



export function crearDB() {
    // Crear Base de Datos versión 1.0
    const crearDB = window.indexedDB.open('citas', 1);


    // Si hay un error
    crearDB.onerror = function () {
        console.log('Hubo un error creando la base de datos.');
    }


    // Si todo sale bien
    crearDB.onsuccess = function () {
        console.log('Base de Datos creada correctamente.');

        DB = crearDB.result;

        // Mostrar citas al cargar (IndexedDB ya está listo)
        ui.imprimirCitas();
    }


    // Configurar el almacén de objetos (Este método solo se ejecuta la 1ra vez que se crea la Base de Datos)
    crearDB.onupgradeneeded = function (e) {

        // Hacer referencia a la base de datos
        const db = e.target.result;

        // Crear almacén de objetos (objectStore) llamado 'citas'
        const objectStore = db.createObjectStore('citas', {
            keyPath: 'id', // La clave primaria de los objetos almacenados en este almacén de objetos es 'id'. Al llamarse igual que la propiedad 'id' de citaObj, va a ser igual al id de cada objeto que se inserte en la Base de Datos.
            autoIncrement: true
        })

        // Definir los índices de las propiedades de los objetos, que se van a insertar en la Base de Datos... Deben ser los mismos que las propiedades de 'citaObj'
        objectStore.createIndex('mascota', 'mascota', { unique: false });
        objectStore.createIndex('propietario', 'propietario', { unique: false });
        objectStore.createIndex('telefono', 'telefono', { unique: false });
        objectStore.createIndex('fecha', 'fecha', { unique: false });
        objectStore.createIndex('hora', 'hora', { unique: false });
        objectStore.createIndex('sintomas', 'sintomas', { unique: false });
        objectStore.createIndex('id', 'id', { unique: true });

        console.log('Base de Datos creada por primera vez');
    }
}