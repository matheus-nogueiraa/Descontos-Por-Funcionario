<!DOCTYPE html>
<html lang="en">

<head>
  <link rel="stylesheet" href="/style-guide/css/fluig-style-guide.min.css">
  <link rel="stylesheet" href="../webapp/resources/css/wdg_inventario_almoxarifado.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="stylesheet" href="../webapp/resources/css/wgd_descontos_por_funcionario.css">
  <link rel="stylesheet" href="https://fluigtst.elcop.eng.br:8443//style-guide/css/fluig-style-guide.min.css">

  <script src="/portal/resources/js/jquery/jquery.js"></script>
  <script src="/portal/resources/js/jquery/jquery-ui.min.js"></script>
  <script src="/portal/resources/js/mustache/mustache-min.js"></script>
  <script src="/style-guide/js/fluig-style-guide.min.js" charset="utf-8"></script>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
  <script src="./script.js"></script>
  <script type="text/javascript" src="/portal/resources/style-guide/js/fluig-style-guide.min.js"></script>
</head>

<body>
  <div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide"
    data-params="MyWidget.instance()">

    <div class="card">
      <div class="card-body">
        <div class="row">
          <div class="form-group col-md-6 css_header_img" style="margin-left: 1rem;">
            <img src="/wdg_inventario_almoxarifado/resources/images/elcop_nossa_energia.png" alt="Logo Elcop"
              width="329px" height="194px">
            <label class="css_header_text">Descontos por Funcionário</label>
          </div>
        </div>
      </div>
    </div>
    <ul class="nav nav-tabs justify-content-center clearfix" role="tablist"
      style="display: flex; justify-content: center;">
      <li class="active">
        <a href="#" style="margin-right: 3rem">
          <i class="flaticon flaticon-person-cost icon-md" aria-hidden="true"></i>
          Cadastro
        </a>
      </li>
      <li>
        <a href="#">
          <i class="flaticon flaticon-search icon-md" aria-hidden="true"></i>
          Consulta
        </a>
      </li>
    </ul>
    <div class="card mt-4">
      <div id="tab-cadastro" class="tab-content">
        <div class="card-body">
          <h2>Cadastro</h2>
          <br>
          <div class="panel panel-default">
            <div class="panel-heading">
              <h3 class="panel-title">Descontos por Funcionário</h3>
            </div>
            <div class="panel-body">
              <div class="form-group">
                <div class="col-md-9">
                  <label for="">Selecione o Funcionário</label>
                  <input type="text" id="funcionario" class="form-control" placeholder="Digite o nome do funcionário">
                </div>
                <div class="col-md-3">
                  <label for="">&nbsp;</label>
                  <button id="btn-buscar" class="btn btn-primary form-control">
                    <i class="bi bi-search"></i>
                    Consultar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="tab-consulta" class="tab-content" style="display:none;">
        <div class="card-body">
          <h2>Consulta</h2>
          <br>
          <div class="panel panel-default">
            <div class="panel-heading">
              <h3 class="panel-title">Consulta de Descontos</h3>
            </div>
            <div class="panel-body">
              <p>Adicione aqui o conteúdo relacionado à consulta de descontos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

</html>