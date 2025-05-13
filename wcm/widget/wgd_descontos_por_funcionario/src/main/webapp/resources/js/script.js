$(document).ready(function() {
  // Inicializa: mostra apenas o conteúdo da aba Cadastro
  $('.tab-content').hide();
  $('#tab-cadastro').show();

  // Troca de abas
  $('.nav-tabs li').click(function(e) {
    e.preventDefault();
    $('.nav-tabs li').removeClass('active');
    $(this).addClass('active');

    // Esconde todos os conteúdos
    $('.tab-content').hide();

    // Mostra o conteúdo da aba clicada
    if ($(this).index() === 0) {
      $('#tab-cadastro').show();
    } else {
      $('#tab-consulta').show();
    }
  });
});