<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://fluig.elcop.eng.br:8443/style-guide/css/fluig-style-guide.min.css">
  <link rel="stylesheet" href="../webapp/resources/css/wgd_consulta_lancamentos_descontos_funcionario.css">
  <script src="/portal/resources/js/jquery/jquery.js"></script>
  <script src="/portal/resources/js/jquery/jquery-ui.min.js"></script>
  <script src="/style-guide/js/fluig-style-guide.min.js"></script>
  <script src="/style-guide/js/fluig-style-guide-chart.min.js"></script>
  <script src="/webdesk/vcXMLRPC.js"></script>
  <script src="/webdesk/vcXMLRPC-mobile.js"></script>
  <script src="//cdn.datatables.net/1.11.3/js/jquery.dataTables.min.js" charset="utf-8"></script>
  <script src="//cdn.datatables.net/buttons/2.1.0/js/dataTables.buttons.min.js" charset="utf-8"></script>
  <link rel="stylesheet" href="//cdn.datatables.net/1.11.3/css/jquery.dataTables.min.css">
  <link rel="stylesheet" href="//cdn.datatables.net/buttons/2.1.0/css/buttons.dataTables.min.css">
  <script src="//cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js" charset="utf-8"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js" charset="utf-8"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js" charset="utf-8"></script>
  <script src="//cdn.datatables.net/buttons/2.1.0/js/buttons.html5.min.js" charset="utf-8"></script>
  <script src="//cdn.datatables.net/buttons/2.1.0/js/buttons.print.min.js" charset="utf-8"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/signature_pad@2.3.2/dist/signature_pad.min.js"></script>
  <title>Document</title>
</head>

<div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide"
  data-params="MyWidget.instance()">

  <div class="card">
    <div class="card-body">
      <div class="row">
        <div class="form-group col-md-6 css_header_img" style="margin-left: 1rem;">
          <img src="/wgd_consulta_lancamentos_descontos/resources/images/elcop_nossa_energia.png" alt="Logo Elcop"
            width="329" height="194">
          <label class="css_header_text">Consulta Lançamentos de Descontos</label>
        </div>
      </div>
    </div>
  </div>

  <!-- Switch com ON/OFF -->
  <div class="card">
    <div class="card-body">
      <div class="row">
        <div class="form-group col-md-6">
          <label for="permitirAprovacao">Permitir Aprovações?</label>
          <div id="switchDinamicoContainer" class="mt-2">
            <div id="switchWrapper" class="switch switch-danger switch-labels switch-xl">
              <input class="switch-input" type="checkbox" id="permitirAprovacao" />
              <label class="switch-button" for="permitirAprovacao">Toggle</label>
              <span id="switchMsg" class="ml-3"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="css_nav_margin" id="panel_episxfuncionario">
    <div class="card">
      <div class="card-body">
        <h4 class="card-title">Filtros</h4>
        <div class="row">
          <div class="form-group col-md-4">
            <label for="codFilialFiltro">Filial: </label>
            <select name="codFilialFiltro" id="codFilialFiltro" class="form-control"></select>
          </div>
          <div class="form-group col-md-4">
            <label for="matriculaFiltro">Matrícula: </label>
            <input type="text" name="matriculaFiltro" id="matriculaFiltro" class="form-control">
          </div>
          <div class="form-group col-md-4">
            <label for="statusAtualProcesso">Status: </label>
            <select name="statusAtualProcesso" id="statusAtualProcesso" class="form-control">
              <option value="">Todos</option>
              <option value="22" selected>Pendente Aprovação Gestor</option>
              <option value="27">Desconto Abonado</option>
              <option value="10">Desconto Lançado Protheus</option>
              <option value="EM_ANDAMENTO">Processo Em Andamento</option>
            </select>
          </div>
        </div>
        <!--
        <div class="row">
          <div class="form-group col-md-6">
            <label for="dataInclusaoDeFiltro">Data Inclusão Desconto De: </label>
            <input type="date" name="dataInclusaoDeFiltro" id="dataInclusaoDeFiltro" class="form-control">
          </div>
          <div class="form-group col-md-6">
            <label for="dataInclusaoAteFiltro">Data Inclusão Desconto Até: </label>
            <input type="date" name="dataInclusaoAteFiltro" id="dataInclusaoAteFiltro" class="form-control">
          </div>
        </div>
        -->
        <br>
        <div class="row">
          <div class="form-group col-md-12">
            <button class="btn btn-success widthFull" onclick="loadTable()" id="filterButton">Consultar
              Descontos</button>
          </div>
        </div>
        <div class="row" id="loaderTable">
          <div class="form-group col-md-12 col-sm-12">
            <div class="container">
              <div class="loader centered"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="panelDescontos">
      <div class="panel panel-default">
        <div id="divTableAtestados" class="panel-body" style="overflow: auto;">
          <br>
          <div class="row">
            <table id="datapanelDescontos" class="display" width="100%"></table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

</html>