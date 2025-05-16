$(document).ready(function () {
  // Inicializa: mostra apenas o conteúdo da aba Cadastro
  $('.tab-content').hide();
  $('#tab-consulta').show();

  // Troca de abas
  $('.nav-tabs li').click(function (e) {
    e.preventDefault();
    $('.nav-tabs li').removeClass('active');
    $(this).addClass('active');

    // Esconde todos os conteúdos
    $('.tab-content').hide();

    // Mostra o conteúdo da aba clicada
    if ($(this).index() === 0) {
      $('#tab-consulta').show();
    } else {
      $('#tab-cadastro').show();
    }
  });

  $('#btn-buscar').click(function (e) {
    e.preventDefault();
    $(this).hide();
    $('#btn-limpar').show();
  });

  $('#btn-limpar').click(function (e) {
    e.preventDefault();
    $(this).hide();
    $('#btn-buscar').show();
  });

});