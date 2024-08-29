var procesar =
{
    total:0.00, tcambio:1, decimals:2,

    init()
    {
        const form_contado = document.getElementById("form_liquidacion_contado");
        const form_credito = document.getElementById("form_liquidacion_credito");
        const form_consignado = document.getElementById("form_liquidacion_consignado");
        const form_noaplica = document.getElementById("form_liquidacion_na");
        const form_devolucion = document.getElementById("form_devolucion");
        
        if (form_contado) this.contado.init(form_contado);
        if (form_credito) this.credito.init(form_credito);
        if (form_consignado) this.consignado.init(form_consignado);
        if (form_noaplica) this.noaplica.init(form_noaplica);
        if (form_devolucion) this.devolucion.init(form_devolucion);
    },

    contado:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;

            const sel_cuenta = this.fields["sel_cuenta"];
            const txt_importe = this.fields["txt_importe"];

            form.addEventListener("submit", (e) => {
                e.submitter.disabled = true;
            });
            
            sel_cuenta.addEventListener("change", () => {
                const opt_cuenta = sel_cuenta.options[sel_cuenta.selectedIndex];
                let tcc = Number(opt_cuenta.getAttribute("data-tcambio") ?? "1");
                let factor = Math.div(procesar.tcambio, tcc);
                let importe = Number(procesar.total);
                importe = Math.mul(importe, factor);
                
                txt_importe.value = Math.RoundTo(importe, procesar.decimals)
            });

            let e = new Event("change");
            sel_cuenta.dispatchEvent(e);
        }
    },
    credito:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;

            const sel_divisa = this.fields["sel_divisa"];
            const txt_tcambio = this.fields["txt_tcambio"];

            form.addEventListener("submit", (e) => {
                e.submitter.disabled = true;
            });

            sel_divisa.addEventListener("change", () => {
                const opt_divisa = sel_divisa.options[sel_divisa.selectedIndex];
                txt_tcambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
            });
        },
    },
    consignado:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;

            form.addEventListener("submit", (e) => {
                e.submitter.disabled = true;
            });
        }
    },
    noaplica:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;

            form.addEventListener("submit", (e) => {
                e.submitter.disabled = true;
            });
        }
    },
    devolucion:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;

            const rdb_retiro = this.fields["rdb_retiro"];
            const rdb_bonifi = this.fields["rdb_bonificacion"];
            const div_cuenta = document.getElementById("div_sel_cuenta");
            const div_egreso = document.getElementById("div_cat_egreso");

            form.addEventListener("submit", (e) => {
                e.submitter.disabled = true;
            });

            rdb_retiro.addEventListener("focus", () => {
                div_cuenta.hidden = false;
                div_egreso.hidden = false;
            });
            rdb_bonifi.addEventListener("focus", () => {
                div_cuenta.hidden = true;
                div_egreso.hidden = true;
            });
        },
    },
}