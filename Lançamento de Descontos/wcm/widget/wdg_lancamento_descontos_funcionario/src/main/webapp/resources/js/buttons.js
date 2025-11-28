$(document).ready(function () {
  // Inicializa: mostra apenas o conteúdo da aba Cadastro

  $('#btn-buscar').click(function (e) {
    e.preventDefault();
    //$(this).hide();
    $('#btn-limpar').show();
  });

  $('#btn-limpar').click(function (e) {
    e.preventDefault();
    $(this).hide();
    $('#btn-buscar').show();
  });

});