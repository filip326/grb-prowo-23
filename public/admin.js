/** @type {HTMLDivElement} */
const myClass = document.querySelector('.myClass');


// class management
async function classManagement() {
    const res = await fetch('/my-class', {
        method: 'GET'
    });
    const data = await res.json();
    if (data.allowedToCreate == true) {
        document.querySelector('form.class-create').style.display = 'block';
    }
    if (data.exists == true) {
        document.querySelector('div.class-create').style.display = 'block';
        document.querySelector('span#class_name').innerText = data.class;
        document.querySelector('span#class_grade').innerText = data.grade;
    }
}
classManagement();

