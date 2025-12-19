
function createDataset(fields, constraints, sortFields) {
  var dataset = DatasetBuilder.newDataset();
  dataset.addColumn("permitirAprovacao");
  
  var permitirAprovacao = '';

  // Log das constraints recebidas
  log.info("ds_parametro_permitir_aprovacao - Constraints recebidas: " + JSON.stringify(constraints));

  if (constraints && constraints.length > 0) {
    var constraint = constraints[0];
    log.info("ds_parametro_permitir_aprovacao - Valor recebido: " + constraint.initialValue);
    
    // Salva o valor original (0 ou 1)
    permitirAprovacao = constraint.initialValue;
  }

  log.info("ds_parametro_permitir_aprovacao - Valor final: " + permitirAprovacao);
  
  dataset.addRow([ permitirAprovacao ]);
  return dataset;
}

function onMobileSync(user) {

}