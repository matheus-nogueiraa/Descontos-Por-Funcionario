/*
 *
 *
 * modals.js
 *
 *
*/


function clickModalCompra(){
    $("button#btnModalCompra").click(function (params) {
        console.log(params);
        modalHistoricoCompra(params);
    });
}
function clickModalFrota(){
    $("button#btnModalFrota").click(function (params) {
        console.log(params);
        modalHistoricoFrota(params);
    });
}

function modalHistoricoCompra(params) {
    var codMaterialCompra = $(params.currentTarget).closest("tr").find("input[id^='codigo_material_compras']").val();
    var descMaterialCompra = $(params.currentTarget).closest("tr").find("input[id^='descricao_material_compras']").val();
    var dataset = DatasetFactory.getDataset('dsConsultaHistoricoCompra', [codMaterialCompra], null, null);
    
    var tabela = "";
    for (let index = 0; index < dataset.values.length; index++) {
        tabela += '<tr>    '
            + '<td>' + dataset.values[index]["CNOMEFORNEC"] + '</td>    '
            + '<td>' + dataset.values[index]["CDATAENTRADA"] + '</td>    '
            + '<td>' + dataset.values[index]["CTIPOOPER"] + '</td>    '
            + '<td>' + dataset.values[index]["NQUANTIDADE"] + '</td>    '
            + '<td>' + dataset.values[index]["CUMPRODUTO"] + '</td>    '
            + '<td>' + dataset.values[index]["CVLRUNITARIO"] + '</td>    '
            + '</tr>    ';
    }

    var modal_um = FLUIGC.modal({
        title: 'HISTÓRICO DE COMPRA',
        content: '<h3 align="center">CÓDIGO: '+codMaterialCompra+'<br>PRODUTO: '+descMaterialCompra+' </h3> '
            + '<div style="width: 100% !important; height: 50% !important; padding: 20px !important;">    '
            + '<table id="modalHistoricoCompras" class="table table-striped">    '
            + '      <thead>    '
            + '        <tr>    '
            + '          <th>FORNECEDOR</th>    '
            + '          <th>DATA</th>    '
            + '          <th>TIPO_OPERACAO</th>    '
            + '          <th>QTD</th>    '
            + '          <th>UNI_MEDIDA</th>    '
            + '          <th>VLR_UNITARIO</th>    '
            + '        </tr>    '
            + '      </thead>    '
            + '      <tbody>    '
            + '        <tr>    '
            + tabela
            + '      </tbody>    '
            + '    </table>    '
            + '</div>    ',
            
        id: 'fluig-modal-um',
        size: 'large',
        actions: [ /*{ 
            'label': 'Save',
            'bind': 'data-your-modal',
        },*/ {
            'label': 'Fechar',
            'autoClose': true
        }]
    }, function (err, data) {
        if (err) {
            // do error handling
        } else {
            console.log(data);
        }
    });
    
}

function modalHistoricoFrota(params) {
    var codMaterialFrota = $(params.currentTarget).closest("tr").find("input[id^='codigo_material_frota']").val();
    var descMaterialFrota = $(params.currentTarget).closest("tr").find("input[id^='descricao_material_frota']").val();
    var dataset = DatasetFactory.getDataset('dsConsultaHistoricoCompra', [codMaterialFrota], null, null);
    var tabela = "";
    for (let index = 0; index < dataset.values.length; index++) {
        tabela += '<tr>    '
            + '<td>' + dataset.values[index]["CNOMEFORNEC"] + '</td>    '
            + '<td>' + dataset.values[index]["CDATAENTRADA"] + '</td>    '
            + '<td>' + dataset.values[index]["CTIPOOPER"] + '</td>    '
            + '<td>' + dataset.values[index]["NQUANTIDADE"] + '</td>    '
            + '<td>' + dataset.values[index]["CUMPRODUTO"] + '</td>    '
            + '<td>' + dataset.values[index]["CVLRUNITARIO"] + '</td>    '
            + '</tr>    ';
    }

    var modal_um = FLUIGC.modal({
        title: 'HISTÓRICO DE COMPRA',
        content: '<h3 align="center">CÓDIGO: '+codMaterialFrota+'<br>PRODUTO: '+descMaterialFrota+'</h3>'
            + '<div style="width: 100% !important; height: 50% !important; padding: 20px !important;">    '
            + '<table id="modalHistoricoCompras" class="table table-striped">    '
            + '      <thead>    '
            + '        <tr>    '
            + '          <th>FORNECEDOR</th>    '
            + '          <th>DATA</th>    '
            + '          <th>TIPO_OPERACAO</th>    '
            + '          <th>QTD</th>    '
            + '          <th>UNI_MEDIDA</th>    '
            + '          <th>VLR_UNITARIO</th>    '
            + '        </tr>    '
            + '      </thead>    '
            + '      <tbody>    '
            + '        <tr>    '
            + tabela
            + '      </tbody>    '
            + '    </table>    '
            + '</div>    ',
            
        id: 'fluig-modal-um',
        size: 'large',
        actions: [ /*{ 
            'label': 'Save',
            'bind': 'data-your-modal',
        },*/ {
            'label': 'Fechar',
            'autoClose': true
        }]
    }, function (err, data) {
        if (err) {
            // do error handling
        } else {
            console.log(data);
        }
    });
}