/*
 *
 *
 * main.js
 * 
 *
*/


function toastMsg(titulo, message, tipo){
    FLUIGC.toast({
		title: titulo,
		message: message,
		type: tipo
	});
}

function showSweetTimerAlert(msg, icon){
    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })
    Toast.fire({
        icon: icon,
        html: msg
    });
}

function inputsDisabled(){
    $("input[type='radio']").attr("disabled", false);
    $("input[type='checkbox']").attr("disabled", false);
}

function setReadonlyElements(arrayId) {
    arrayId.forEach(function(id) {
        var element = document.getElementById(id);
        if (element) {
            if (element.tagName.toLowerCase() === 'input') {
                var type = element.type.toLowerCase();
                if (type === 'text') {
                    element.setAttribute('readonly', 'true');
                } else if (type === 'radio' || type === 'checkbox' || type === 'button') {
                    element.disabled = true;
                }
            }else if (element.tagName.toLowerCase() === 'textarea') {
                element.setAttribute('readonly', 'true');
            }else if (element.tagName.toLowerCase() === 'select') {
                element.setAttribute('readonly', 'true');
                element.classList.add('css_select_disabled');
            }else if (element.tagName.toLowerCase() === 'button') {
                element.disabled = true;
            }
        }
    });
}

function removeReadonlyElements(arrayId) {
    arrayId.forEach(function(id) {
        var element = document.getElementById(id);
        if (element) {
            if (element.tagName.toLowerCase() === 'input') {
                var type = element.type.toLowerCase();
                if (type === 'text') {
                    element.removeAttribute('readonly');
                } else if (type === 'radio' || type === 'checkbox' || type === 'button') {
                    element.disabled = false;
                }
            } else if (element.tagName.toLowerCase() === 'textarea') {
                element.removeAttribute('readonly');
            } else if (element.tagName.toLowerCase() === 'select') {
                element.removeAttribute('readonly');
                element.classList.remove('css_select_disabled');
            } else if (element.tagName.toLowerCase() === 'button') {
                element.disabled = false;
            }
        }
    });
}

function readonlyPaiFilho(tableName, indexId, tableFields) {
    var tbl = $("table#" + tableName + " tr td [id^='" + indexId + "']");
    for (var i = 0; i < tbl.length; i++) {
        var idx = tbl[i].id.split('___');
        for (var j = 0; j < tableFields.length; j++) {
            $("#" + tableFields[j] + idx[1]).attr('readonly', true).css({ 'pointer-events': 'none', 'touch-action': 'none' });
        }
    }
}

function emptyField(id) {
    return $("#"+id).val() == "" || $("#"+id).val() == null;
}

function labelText(inputId) {
    const labelElement = document.querySelector(`label[for="${inputId}"]`);
    if (labelElement) {
        const labelText = labelElement.innerText;
        return labelText;
    }
}

function transformUppercase(obj){
    let id = obj.id;
    let value = obj.value;
    let acento = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let maiuscula = acento.toUpperCase();
    $("#" + id).val(maiuscula);
}