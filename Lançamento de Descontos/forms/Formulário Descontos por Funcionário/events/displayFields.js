function displayFields(form, customHTML) {
    var TOKEN_ESPERADO = "WIDGET_DESCONTOS_V1";

    var numState = String(getValue("WKNumState") || "0");
    var isStart = (numState === "0");
    var originToken = form.getValue("originToken") || "";

    //try { form.setShowDisabledFields(true); form.setHidePrintLink(true); } catch (e) { }

    try {
        customHTML.append(
            "<input type='hidden' id='originToken' name='originToken' value='" + (originToken || "") + "'/>"
        );
    } catch (e) { }

    if (isStart && originToken !== TOKEN_ESPERADO) {
        var msg = "Este processo deve ser iniciado exclusivamente pela Página Pública de Lançamentos de Descontos. Feche esta tela e utilize a página oficial.";

        var css =
            "<style id='__lockCSS'>" +
            " #__lockOverlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;}" +
            " #__lockCard{background:#fff;max-width:720px;width:92%;padding:24px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:Arial,Helvetica,sans-serif;}" +
            " #__lockCard h3{margin:0 0 8px 0;font-size:20px;color:#a94442;}" +
            " #__lockCard p{margin:0;line-height:1.45;color:#333;}" +
            " #workflowActions{display:none !important;}" +
            "</style>";

        var htmlOverlay =
            "<div id='__lockOverlay' aria-hidden='true'>" +
            "  <div id='__lockCard' role='dialog' aria-modal='true'>" +
            "    <h3>Ação bloqueada</h3>" +
            "    <p>" + msg + "</p>" +
            "  </div>" +
            "</div>";

        var js =
            "<script>(function(){\n" +
            "  function disableInteractive(){\n" +
            "    try{\n" +
            "      document.querySelectorAll('#workflowActions').forEach(function(el){ el.style.display='none'; });\n" +
            "      window.parent.$('#workflowActions').hide();\n" +
            "      var sels=[ '.btn-primary','.btn-success','.btn-danger','[data-send]','[data-save]','[type=submit]' ];\n" +
            "      sels.forEach(function(sel){\n" +
            "        try{ document.querySelectorAll(sel).forEach(function(el){ el.disabled=true; el.style.pointerEvents='none'; el.classList.add('disabled'); }); }catch(e){}\n" +
            "      });\n" +
            "      window.addEventListener('submit', function(ev){ ev.preventDefault(); ev.stopPropagation(); }, true);\n" +
            "      window.addEventListener('click',  function(ev){ var ov=document.getElementById('__lockOverlay'); if(ov){ ev.stopPropagation(); }}, true);\n" +
            "      window.addEventListener('keydown', function(ev){ var ov=document.getElementById('__lockOverlay'); if(ov){ ev.preventDefault(); ev.stopPropagation(); }}, true);\n" +
            "    }catch(e){}\n" +
            "  }\n" +
            "  function observeAndDisable(){\n" +
            "    try{\n" +
            "      var mo=new MutationObserver(function(){ disableInteractive(); });\n" +
            "      mo.observe(document.documentElement||document.body,{childList:true,subtree:true});\n" +
            "    }catch(e){}\n" +
            "  }\n" +
            "  function notify(){\n" +
            "    try{ if(window.parent && window.parent.parent && window.parent.parent.WCMSpaceAPI){\n" +
            "      window.parent.parent.WCMSpaceAPI.message({ type:'warning', message: " + JSON.stringify(msg) + " });\n" +
            "    }}catch(e){}\n" +
            "    try{ console.warn(" + JSON.stringify(msg) + "); }catch(e){}\n" +
            "  }\n" +
            "  function mountOverlay(){\n" +
            "    if(!document.getElementById('__lockOverlay')){\n" +
            "      var wrap=document.createElement('div'); wrap.innerHTML=" + JSON.stringify(htmlOverlay) + ";\n" +
            "      document.body.appendChild(wrap.firstChild);\n" +
            "    }\n" +
            "  }\n" +
            "  function boot(){ disableInteractive(); observeAndDisable(); mountOverlay(); notify(); }\n" +
            "  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }\n" +
            "})();</script>";

        try { customHTML.append(css); } catch (e) { }
        try { customHTML.append(js); } catch (e) { }
    } else {
        try { customHTML.append("<script>window._ORIGIN_ALLOWED=true;</script>"); } catch (e) { }
    }
}