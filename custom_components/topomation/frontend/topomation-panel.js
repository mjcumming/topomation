/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ae = globalThis, ai = ae.ShadowRoot && (ae.ShadyCSS === void 0 || ae.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, si = Symbol(), fi = /* @__PURE__ */ new WeakMap();
let Xi = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== si) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ai && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = fi.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && fi.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const An = (s) => new Xi(typeof s == "string" ? s : s + "", void 0, si), Yt = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, n, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + s[o + 1], s[0]);
  return new Xi(e, s, si);
}, En = (s, t) => {
  if (ai) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), n = ae.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = e.cssText, s.appendChild(i);
  }
}, _i = ai ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return An(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Dn, defineProperty: Tn, getOwnPropertyDescriptor: Ln, getOwnPropertyNames: Cn, getOwnPropertySymbols: In, getPrototypeOf: Rn } = Object, pt = globalThis, mi = pt.trustedTypes, On = mi ? mi.emptyScript : "", De = pt.reactiveElementPolyfillSupport, zt = (s, t) => s, Ve = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? On : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, Qi = (s, t) => !Dn(s, t), vi = { attribute: !0, type: String, converter: Ve, reflect: !1, useDefault: !1, hasChanged: Qi };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), pt.litPropertyMetadata ?? (pt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let At = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = vi) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, e);
      n !== void 0 && Tn(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: n, set: o } = Ln(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: n, set(a) {
      const r = n == null ? void 0 : n.call(this);
      o == null || o.call(this, a), this.requestUpdate(t, r, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? vi;
  }
  static _$Ei() {
    if (this.hasOwnProperty(zt("elementProperties"))) return;
    const t = Rn(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(zt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(zt("properties"))) {
      const e = this.properties, i = [...Cn(e), ...In(e)];
      for (const n of i) this.createProperty(n, e[n]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, n] of e) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const n = this._$Eu(e, i);
      n !== void 0 && this._$Eh.set(n, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const n of i) e.unshift(_i(n));
    } else t !== void 0 && e.push(_i(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return En(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var o;
    const i = this.constructor.elementProperties.get(t), n = this.constructor._$Eu(t, i);
    if (n !== void 0 && i.reflect === !0) {
      const a = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : Ve).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var o, a;
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), c = typeof r.converter == "function" ? { fromAttribute: r.converter } : ((o = r.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? r.converter : Ve;
      this._$Em = n;
      const d = c.fromAttribute(e, r.type);
      this[n] = d ?? ((a = this._$Ej) == null ? void 0 : a.get(n)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var n;
    if (t !== void 0) {
      const o = this.constructor, a = this[t];
      if (i ?? (i = o.getPropertyOptions(t)), !((i.hasChanged ?? Qi)(a, e) || i.useDefault && i.reflect && a === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: n, wrapped: o }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), o !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), n === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, a] of this._$Ep) this[o] = a;
        this._$Ep = void 0;
      }
      const n = this.constructor.elementProperties;
      if (n.size > 0) for (const [o, a] of n) {
        const { wrapped: r } = a, c = this[o];
        r !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, a, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((n) => {
        var o;
        return (o = n.hostUpdate) == null ? void 0 : o.call(n);
      }), this.update(e)) : this._$EM();
    } catch (n) {
      throw t = !1, this._$EM(), n;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var n;
      return (n = i.hostUpdated) == null ? void 0 : n.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
At.elementStyles = [], At.shadowRootOptions = { mode: "open" }, At[zt("elementProperties")] = /* @__PURE__ */ new Map(), At[zt("finalized")] = /* @__PURE__ */ new Map(), De == null || De({ ReactiveElement: At }), (pt.reactiveElementVersions ?? (pt.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ft = globalThis, ue = Ft.trustedTypes, yi = ue ? ue.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, Ji = "$lit$", lt = `lit$${Math.random().toFixed(9).slice(2)}$`, Zi = "?" + lt, Pn = `<${Zi}>`, xt = document, Kt = () => xt.createComment(""), Vt = (s) => s === null || typeof s != "object" && typeof s != "function", ri = Array.isArray, Mn = (s) => ri(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", Te = `[ 	
\f\r]`, Ot = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, bi = /-->/g, wi = />/g, ft = RegExp(`>|${Te}(?:([^\\s"'>=/]+)(${Te}*=${Te}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), xi = /'/g, ki = /"/g, tn = /^(?:script|style|textarea|title)$/i, Nn = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), _ = Nn(1), kt = Symbol.for("lit-noChange"), z = Symbol.for("lit-nothing"), Si = /* @__PURE__ */ new WeakMap(), bt = xt.createTreeWalker(xt, 129);
function en(s, t) {
  if (!ri(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return yi !== void 0 ? yi.createHTML(t) : t;
}
const Bn = (s, t) => {
  const e = s.length - 1, i = [];
  let n, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = Ot;
  for (let r = 0; r < e; r++) {
    const c = s[r];
    let d, u, l = -1, p = 0;
    for (; p < c.length && (a.lastIndex = p, u = a.exec(c), u !== null); ) p = a.lastIndex, a === Ot ? u[1] === "!--" ? a = bi : u[1] !== void 0 ? a = wi : u[2] !== void 0 ? (tn.test(u[2]) && (n = RegExp("</" + u[2], "g")), a = ft) : u[3] !== void 0 && (a = ft) : a === ft ? u[0] === ">" ? (a = n ?? Ot, l = -1) : u[1] === void 0 ? l = -2 : (l = a.lastIndex - u[2].length, d = u[1], a = u[3] === void 0 ? ft : u[3] === '"' ? ki : xi) : a === ki || a === xi ? a = ft : a === bi || a === wi ? a = Ot : (a = ft, n = void 0);
    const f = a === ft && s[r + 1].startsWith("/>") ? " " : "";
    o += a === Ot ? c + Pn : l >= 0 ? (i.push(d), c.slice(0, l) + Ji + c.slice(l) + lt + f) : c + lt + (l === -2 ? r : f);
  }
  return [en(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Gt {
  constructor({ strings: t, _$litType$: e }, i) {
    let n;
    this.parts = [];
    let o = 0, a = 0;
    const r = t.length - 1, c = this.parts, [d, u] = Bn(t, e);
    if (this.el = Gt.createElement(d, i), bt.currentNode = this.el.content, e === 2 || e === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (n = bt.nextNode()) !== null && c.length < r; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const l of n.getAttributeNames()) if (l.endsWith(Ji)) {
          const p = u[a++], f = n.getAttribute(l).split(lt), h = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: o, name: h[2], strings: f, ctor: h[1] === "." ? Fn : h[1] === "?" ? jn : h[1] === "@" ? Wn : xe }), n.removeAttribute(l);
        } else l.startsWith(lt) && (c.push({ type: 6, index: o }), n.removeAttribute(l));
        if (tn.test(n.tagName)) {
          const l = n.textContent.split(lt), p = l.length - 1;
          if (p > 0) {
            n.textContent = ue ? ue.emptyScript : "";
            for (let f = 0; f < p; f++) n.append(l[f], Kt()), bt.nextNode(), c.push({ type: 2, index: ++o });
            n.append(l[p], Kt());
          }
        }
      } else if (n.nodeType === 8) if (n.data === Zi) c.push({ type: 2, index: o });
      else {
        let l = -1;
        for (; (l = n.data.indexOf(lt, l + 1)) !== -1; ) c.push({ type: 7, index: o }), l += lt.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = xt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function Lt(s, t, e = s, i) {
  var a, r;
  if (t === kt) return t;
  let n = i !== void 0 ? (a = e._$Co) == null ? void 0 : a[i] : e._$Cl;
  const o = Vt(t) ? void 0 : t._$litDirective$;
  return (n == null ? void 0 : n.constructor) !== o && ((r = n == null ? void 0 : n._$AO) == null || r.call(n, !1), o === void 0 ? n = void 0 : (n = new o(s), n._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = n : e._$Cl = n), n !== void 0 && (t = Lt(s, n._$AS(s, t.values), n, i)), t;
}
let zn = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, n = ((t == null ? void 0 : t.creationScope) ?? xt).importNode(e, !0);
    bt.currentNode = n;
    let o = bt.nextNode(), a = 0, r = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let d;
        c.type === 2 ? d = new It(o, o.nextSibling, this, t) : c.type === 1 ? d = new c.ctor(o, c.name, c.strings, this, t) : c.type === 6 && (d = new Un(o, this, t)), this._$AV.push(d), c = i[++r];
      }
      a !== (c == null ? void 0 : c.index) && (o = bt.nextNode(), a++);
    }
    return bt.currentNode = xt, n;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class It {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, n) {
    this.type = 2, this._$AH = z, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = n, this._$Cv = (n == null ? void 0 : n.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = Lt(this, t, e), Vt(t) ? t === z || t == null || t === "" ? (this._$AH !== z && this._$AR(), this._$AH = z) : t !== this._$AH && t !== kt && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Mn(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== z && Vt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(xt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: e, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Gt.createElement(en(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === n) this._$AH.p(e);
    else {
      const a = new zn(n, this), r = a.u(this.options);
      a.p(e), this.T(r), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = Si.get(t.strings);
    return e === void 0 && Si.set(t.strings, e = new Gt(t)), e;
  }
  k(t) {
    ri(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, n = 0;
    for (const o of t) n === e.length ? e.push(i = new It(this.O(Kt()), this.O(Kt()), this, this.options)) : i = e[n], i._$AI(o), n++;
    n < e.length && (this._$AR(i && i._$AB.nextSibling, n), e.length = n);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const n = t.nextSibling;
      t.remove(), t = n;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class xe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, n, o) {
    this.type = 1, this._$AH = z, this._$AN = void 0, this.element = t, this.name = e, this._$AM = n, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = z;
  }
  _$AI(t, e = this, i, n) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = Lt(this, t, e, 0), a = !Vt(t) || t !== this._$AH && t !== kt, a && (this._$AH = t);
    else {
      const r = t;
      let c, d;
      for (t = o[0], c = 0; c < o.length - 1; c++) d = Lt(this, r[i + c], e, c), d === kt && (d = this._$AH[c]), a || (a = !Vt(d) || d !== this._$AH[c]), d === z ? t = z : t !== z && (t += (d ?? "") + o[c + 1]), this._$AH[c] = d;
    }
    a && !n && this.j(t);
  }
  j(t) {
    t === z ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Fn extends xe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === z ? void 0 : t;
  }
}
class jn extends xe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== z);
  }
}
class Wn extends xe {
  constructor(t, e, i, n, o) {
    super(t, e, i, n, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Lt(this, t, e, 0) ?? z) === kt) return;
    const i = this._$AH, n = t === z && i !== z || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== z && (i === z || n);
    n && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Un {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Lt(this, t);
  }
}
const Hn = { I: It }, Le = Ft.litHtmlPolyfillSupport;
Le == null || Le(Gt, It), (Ft.litHtmlVersions ?? (Ft.litHtmlVersions = [])).push("3.3.1");
const qn = (s, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const o = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = n = new It(t.insertBefore(Kt(), o), o, void 0, e ?? {});
  }
  return n._$AI(s), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const wt = globalThis;
let gt = class extends At {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = qn(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return kt;
  }
};
var Ui;
gt._$litElement$ = !0, gt.finalized = !0, (Ui = wt.litElementHydrateSupport) == null || Ui.call(wt, { LitElement: gt });
const Ce = wt.litElementPolyfillSupport;
Ce == null || Ce({ LitElement: gt });
(wt.litElementVersions ?? (wt.litElementVersions = [])).push("4.2.1");
const ke = Yt`
  :host {
    /* HA theme variables with fallbacks */
    --primary-color: var(--primary-color, #03a9f4);
    --primary-text-color: var(--primary-text-color, #212121);
    --secondary-text-color: var(--secondary-text-color, #757575);
    --divider-color: var(--divider-color, #e0e0e0);
    --card-background-color: var(--card-background-color, #ffffff);
    --secondary-background-color: var(--secondary-background-color, #f5f5f5);
    --disabled-text-color: var(--disabled-text-color, #9e9e9e);
    --success-color: var(--success-color, #4caf50);
    --error-color: var(--error-color, #f44336);
    --warning-color: var(--warning-color, #ff9800);

    /* Aliases for compatibility */
    --text-primary-color: var(--primary-text-color, #212121);
    --text-secondary-color: var(--secondary-text-color, #757575);
    --disabled-color: var(--disabled-text-color, #9e9e9e);

    /* RGB variants for rgba() usage */
    --rgb-primary-color: 3, 169, 244;
    --rgb-error-color: 244, 67, 54;
    --rgb-warning-color: 255, 152, 0;
    --rgb-success-color: 76, 175, 80;

    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    --border-radius: 4px;
    --transition-speed: 0.2s;
  }

  * {
    box-sizing: border-box;
  }

  .card {
    background: var(--card-background-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-md);
  }

  .section-header {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    letter-spacing: 0.5px;
  }

  .divider {
    height: 1px;
    background: var(--divider-color);
    margin: var(--spacing-md) 0;
  }

  .button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed);
  }

  .button-primary {
    background: var(--primary-color, #03a9f4);
    color: white !important;
    border: none;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background: transparent;
    color: var(--primary-color, #03a9f4) !important;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .button-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  [data-theme="dark"] .button-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .icon-button {
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary-color);
    border-radius: var(--border-radius);
    transition: all var(--transition-speed);
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary-color);
  }

  .text-muted {
    color: var(--text-secondary-color);
    font-size: 12px;
  }

  .error-text {
    color: var(--error-color);
    font-size: 12px;
    margin-top: var(--spacing-xs);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: var(--spacing-md);
  }

  .empty-state-message {
    margin-bottom: var(--spacing-md);
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-state-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
  }
`, Kn = {
  room: "area"
}, nn = /* @__PURE__ */ new Set(["building", "grounds"]);
function Vn(s) {
  const t = String(s ?? "area").trim().toLowerCase(), e = Kn[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function U(s) {
  var t, e;
  return Vn((e = (t = s.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function Ge(s) {
  return s === "floor" ? ["root", "building"] : nn.has(s) ? ["root"] : s === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function Gn(s, t) {
  return Ge(s).includes(t);
}
function Yn(s) {
  var c;
  const { locations: t, locationId: e, newParentId: i } = s;
  if (i === e || i && Ye(t, e, i)) return !1;
  const n = new Map(t.map((d) => [d.id, d])), o = n.get(e);
  if (!o || i && !n.get(i) || i && ((c = n.get(i)) != null && c.is_explicit_root)) return !1;
  const a = U(o);
  if (nn.has(a))
    return i === null;
  const r = i === null ? "root" : U(n.get(i) ?? {});
  return !!Gn(a, r);
}
function Ye(s, t, e) {
  if (t === e) return !1;
  const i = new Map(s.map((a) => [a.id, a]));
  let n = i.get(e);
  const o = /* @__PURE__ */ new Set();
  for (; n != null && n.parent_id; ) {
    if (n.parent_id === t || o.has(n.parent_id)) return !0;
    o.add(n.parent_id), n = i.get(n.parent_id);
  }
  return !1;
}
const Xn = "managed_shadow", Qn = /* @__PURE__ */ new Set(["floor", "building", "grounds"]), Xt = (s) => {
  var t;
  return ((t = s == null ? void 0 : s.modules) == null ? void 0 : t._meta) || {};
}, Qt = (s, t) => {
  const e = s[t];
  return typeof e == "string" ? e.trim() : "";
}, Jn = (s) => Qt(Xt(s), "role").toLowerCase(), Zn = (s) => Qt(Xt(s), "type").toLowerCase(), Se = (s = []) => {
  const t = /* @__PURE__ */ new Set();
  for (const e of s) {
    const i = Xt(e), n = Qt(i, "shadow_area_id");
    n && Qn.has(Zn(e)) && t.add(n);
  }
  return t;
}, $e = (s, t) => {
  if (!s) return !1;
  if (t != null && t.has(s.id))
    return !0;
  const e = Xt(s);
  return !!(Jn(s) === Xn || Qt(e, "shadow_for_location_id"));
}, to = (s) => {
  if (!s) return "";
  const t = Xt(s);
  return Qt(t, "shadow_area_id");
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const eo = { CHILD: 2 }, io = (s) => (...t) => ({ _$litDirective$: s, values: t });
class no {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: oo } = Hn, $i = () => document.createComment(""), Pt = (s, t, e) => {
  var o;
  const i = s._$AA.parentNode, n = t === void 0 ? s._$AB : t._$AA;
  if (e === void 0) {
    const a = i.insertBefore($i(), n), r = i.insertBefore($i(), n);
    e = new oo(a, r, s, s.options);
  } else {
    const a = e._$AB.nextSibling, r = e._$AM, c = r !== s;
    if (c) {
      let d;
      (o = e._$AQ) == null || o.call(e, s), e._$AM = s, e._$AP !== void 0 && (d = s._$AU) !== r._$AU && e._$AP(d);
    }
    if (a !== n || c) {
      let d = e._$AA;
      for (; d !== a; ) {
        const u = d.nextSibling;
        i.insertBefore(d, n), d = u;
      }
    }
  }
  return e;
}, _t = (s, t, e = s) => (s._$AI(t, e), s), ao = {}, so = (s, t = ao) => s._$AH = t, ro = (s) => s._$AH, Ie = (s) => {
  s._$AR(), s._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ai = (s, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let n = t; n <= e; n++) i.set(s[n], n);
  return i;
}, Xe = io(class extends no {
  constructor(s) {
    if (super(s), s.type !== eo.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(s, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const n = [], o = [];
    let a = 0;
    for (const r of s) n[a] = i ? i(r, a) : a, o[a] = e(r, a), a++;
    return { values: o, keys: n };
  }
  render(s, t, e) {
    return this.dt(s, t, e).values;
  }
  update(s, [t, e, i]) {
    const n = ro(s), { values: o, keys: a } = this.dt(t, e, i);
    if (!Array.isArray(n)) return this.ut = a, o;
    const r = this.ut ?? (this.ut = []), c = [];
    let d, u, l = 0, p = n.length - 1, f = 0, h = o.length - 1;
    for (; l <= p && f <= h; ) if (n[l] === null) l++;
    else if (n[p] === null) p--;
    else if (r[l] === a[f]) c[f] = _t(n[l], o[f]), l++, f++;
    else if (r[p] === a[h]) c[h] = _t(n[p], o[h]), p--, h--;
    else if (r[l] === a[h]) c[h] = _t(n[l], o[h]), Pt(s, c[h + 1], n[l]), l++, h--;
    else if (r[p] === a[f]) c[f] = _t(n[p], o[f]), Pt(s, n[l], n[p]), p--, f++;
    else if (d === void 0 && (d = Ai(a, f, h), u = Ai(r, l, p)), d.has(r[l])) if (d.has(r[p])) {
      const g = u.get(a[f]), m = g !== void 0 ? n[g] : null;
      if (m === null) {
        const v = Pt(s, n[l]);
        _t(v, o[f]), c[f] = v;
      } else c[f] = _t(m, o[f]), Pt(s, n[l], m), n[g] = null;
      f++;
    } else Ie(n[p]), p--;
    else Ie(n[l]), l++;
    for (; f <= h; ) {
      const g = Pt(s, c[h + 1]);
      _t(g, o[f]), c[f++] = g;
    }
    for (; l <= p; ) {
      const g = n[l++];
      g !== null && Ie(g);
    }
    return this.ut = a, so(s, c), kt;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function Ei(s, t) {
  var e = Object.keys(s);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(s);
    t && (i = i.filter(function(n) {
      return Object.getOwnPropertyDescriptor(s, n).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function it(s) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ei(Object(e), !0).forEach(function(i) {
      co(s, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(s, Object.getOwnPropertyDescriptors(e)) : Ei(Object(e)).forEach(function(i) {
      Object.defineProperty(s, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return s;
}
function se(s) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? se = function(t) {
    return typeof t;
  } : se = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, se(s);
}
function co(s, t, e) {
  return t in s ? Object.defineProperty(s, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : s[t] = e, s;
}
function at() {
  return at = Object.assign || function(s) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (s[i] = e[i]);
    }
    return s;
  }, at.apply(this, arguments);
}
function lo(s, t) {
  if (s == null) return {};
  var e = {}, i = Object.keys(s), n, o;
  for (o = 0; o < i.length; o++)
    n = i[o], !(t.indexOf(n) >= 0) && (e[n] = s[n]);
  return e;
}
function uo(s, t) {
  if (s == null) return {};
  var e = lo(s, t), i, n;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(s);
    for (n = 0; n < o.length; n++)
      i = o[n], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(s, i) && (e[i] = s[i]);
  }
  return e;
}
var ho = "1.15.6";
function ot(s) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(s);
}
var st = ot(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Jt = ot(/Edge/i), Di = ot(/firefox/i), jt = ot(/safari/i) && !ot(/chrome/i) && !ot(/android/i), ci = ot(/iP(ad|od|hone)/i), on = ot(/chrome/i) && ot(/android/i), an = {
  capture: !1,
  passive: !1
};
function E(s, t, e) {
  s.addEventListener(t, e, !st && an);
}
function A(s, t, e) {
  s.removeEventListener(t, e, !st && an);
}
function he(s, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), s)
      try {
        if (s.matches)
          return s.matches(t);
        if (s.msMatchesSelector)
          return s.msMatchesSelector(t);
        if (s.webkitMatchesSelector)
          return s.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function sn(s) {
  return s.host && s !== document && s.host.nodeType ? s.host : s.parentNode;
}
function Z(s, t, e, i) {
  if (s) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? s.parentNode === e && he(s, t) : he(s, t)) || i && s === e)
        return s;
      if (s === e) break;
    } while (s = sn(s));
  }
  return null;
}
var Ti = /\s+/g;
function Y(s, t, e) {
  if (s && t)
    if (s.classList)
      s.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + s.className + " ").replace(Ti, " ").replace(" " + t + " ", " ");
      s.className = (i + (e ? " " + t : "")).replace(Ti, " ");
    }
}
function b(s, t, e) {
  var i = s && s.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(s, "") : s.currentStyle && (e = s.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Tt(s, t) {
  var e = "";
  if (typeof s == "string")
    e = s;
  else
    do {
      var i = b(s, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (s = s.parentNode));
  var n = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return n && new n(e);
}
function rn(s, t, e) {
  if (s) {
    var i = s.getElementsByTagName(t), n = 0, o = i.length;
    if (e)
      for (; n < o; n++)
        e(i[n], n);
    return i;
  }
  return [];
}
function et() {
  var s = document.scrollingElement;
  return s || document.documentElement;
}
function M(s, t, e, i, n) {
  if (!(!s.getBoundingClientRect && s !== window)) {
    var o, a, r, c, d, u, l;
    if (s !== window && s.parentNode && s !== et() ? (o = s.getBoundingClientRect(), a = o.top, r = o.left, c = o.bottom, d = o.right, u = o.height, l = o.width) : (a = 0, r = 0, c = window.innerHeight, d = window.innerWidth, u = window.innerHeight, l = window.innerWidth), (t || e) && s !== window && (n = n || s.parentNode, !st))
      do
        if (n && n.getBoundingClientRect && (b(n, "transform") !== "none" || e && b(n, "position") !== "static")) {
          var p = n.getBoundingClientRect();
          a -= p.top + parseInt(b(n, "border-top-width")), r -= p.left + parseInt(b(n, "border-left-width")), c = a + o.height, d = r + o.width;
          break;
        }
      while (n = n.parentNode);
    if (i && s !== window) {
      var f = Tt(n || s), h = f && f.a, g = f && f.d;
      f && (a /= g, r /= h, l /= h, u /= g, c = a + u, d = r + l);
    }
    return {
      top: a,
      left: r,
      bottom: c,
      right: d,
      width: l,
      height: u
    };
  }
}
function Li(s, t, e) {
  for (var i = ht(s, !0), n = M(s)[t]; i; ) {
    var o = M(i)[e], a = void 0;
    if (a = n >= o, !a) return i;
    if (i === et()) break;
    i = ht(i, !1);
  }
  return !1;
}
function Ct(s, t, e, i) {
  for (var n = 0, o = 0, a = s.children; o < a.length; ) {
    if (a[o].style.display !== "none" && a[o] !== w.ghost && (i || a[o] !== w.dragged) && Z(a[o], e.draggable, s, !1)) {
      if (n === t)
        return a[o];
      n++;
    }
    o++;
  }
  return null;
}
function li(s, t) {
  for (var e = s.lastElementChild; e && (e === w.ghost || b(e, "display") === "none" || t && !he(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function Q(s, t) {
  var e = 0;
  if (!s || !s.parentNode)
    return -1;
  for (; s = s.previousElementSibling; )
    s.nodeName.toUpperCase() !== "TEMPLATE" && s !== w.clone && (!t || he(s, t)) && e++;
  return e;
}
function Ci(s) {
  var t = 0, e = 0, i = et();
  if (s)
    do {
      var n = Tt(s), o = n.a, a = n.d;
      t += s.scrollLeft * o, e += s.scrollTop * a;
    } while (s !== i && (s = s.parentNode));
  return [t, e];
}
function po(s, t) {
  for (var e in s)
    if (s.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === s[e][i]) return Number(e);
    }
  return -1;
}
function ht(s, t) {
  if (!s || !s.getBoundingClientRect) return et();
  var e = s, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var n = b(e);
      if (e.clientWidth < e.scrollWidth && (n.overflowX == "auto" || n.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (n.overflowY == "auto" || n.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return et();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return et();
}
function go(s, t) {
  if (s && t)
    for (var e in t)
      t.hasOwnProperty(e) && (s[e] = t[e]);
  return s;
}
function Re(s, t) {
  return Math.round(s.top) === Math.round(t.top) && Math.round(s.left) === Math.round(t.left) && Math.round(s.height) === Math.round(t.height) && Math.round(s.width) === Math.round(t.width);
}
var Wt;
function cn(s, t) {
  return function() {
    if (!Wt) {
      var e = arguments, i = this;
      e.length === 1 ? s.call(i, e[0]) : s.apply(i, e), Wt = setTimeout(function() {
        Wt = void 0;
      }, t);
    }
  };
}
function fo() {
  clearTimeout(Wt), Wt = void 0;
}
function ln(s, t, e) {
  s.scrollLeft += t, s.scrollTop += e;
}
function dn(s) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(s).cloneNode(!0) : e ? e(s).clone(!0)[0] : s.cloneNode(!0);
}
function un(s, t, e) {
  var i = {};
  return Array.from(s.children).forEach(function(n) {
    var o, a, r, c;
    if (!(!Z(n, t.draggable, s, !1) || n.animated || n === e)) {
      var d = M(n);
      i.left = Math.min((o = i.left) !== null && o !== void 0 ? o : 1 / 0, d.left), i.top = Math.min((a = i.top) !== null && a !== void 0 ? a : 1 / 0, d.top), i.right = Math.max((r = i.right) !== null && r !== void 0 ? r : -1 / 0, d.right), i.bottom = Math.max((c = i.bottom) !== null && c !== void 0 ? c : -1 / 0, d.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var V = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function _o() {
  var s = [], t;
  return {
    captureAnimationState: function() {
      if (s = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(n) {
          if (!(b(n, "display") === "none" || n === w.ghost)) {
            s.push({
              target: n,
              rect: M(n)
            });
            var o = it({}, s[s.length - 1].rect);
            if (n.thisAnimationDuration) {
              var a = Tt(n, !0);
              a && (o.top -= a.f, o.left -= a.e);
            }
            n.fromRect = o;
          }
        });
      }
    },
    addAnimationState: function(i) {
      s.push(i);
    },
    removeAnimationState: function(i) {
      s.splice(po(s, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var n = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var o = !1, a = 0;
      s.forEach(function(r) {
        var c = 0, d = r.target, u = d.fromRect, l = M(d), p = d.prevFromRect, f = d.prevToRect, h = r.rect, g = Tt(d, !0);
        g && (l.top -= g.f, l.left -= g.e), d.toRect = l, d.thisAnimationDuration && Re(p, l) && !Re(u, l) && // Make sure animatingRect is on line between toRect & fromRect
        (h.top - l.top) / (h.left - l.left) === (u.top - l.top) / (u.left - l.left) && (c = vo(h, p, f, n.options)), Re(l, u) || (d.prevFromRect = u, d.prevToRect = l, c || (c = n.options.animation), n.animate(d, h, l, c)), c && (o = !0, a = Math.max(a, c), clearTimeout(d.animationResetTimer), d.animationResetTimer = setTimeout(function() {
          d.animationTime = 0, d.prevFromRect = null, d.fromRect = null, d.prevToRect = null, d.thisAnimationDuration = null;
        }, c), d.thisAnimationDuration = c);
      }), clearTimeout(t), o ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, a) : typeof i == "function" && i(), s = [];
    },
    animate: function(i, n, o, a) {
      if (a) {
        b(i, "transition", ""), b(i, "transform", "");
        var r = Tt(this.el), c = r && r.a, d = r && r.d, u = (n.left - o.left) / (c || 1), l = (n.top - o.top) / (d || 1);
        i.animatingX = !!u, i.animatingY = !!l, b(i, "transform", "translate3d(" + u + "px," + l + "px,0)"), this.forRepaintDummy = mo(i), b(i, "transition", "transform " + a + "ms" + (this.options.easing ? " " + this.options.easing : "")), b(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          b(i, "transition", ""), b(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, a);
      }
    }
  };
}
function mo(s) {
  return s.offsetWidth;
}
function vo(s, t, e, i) {
  return Math.sqrt(Math.pow(t.top - s.top, 2) + Math.pow(t.left - s.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var St = [], Oe = {
  initializeByDefault: !0
}, Zt = {
  mount: function(t) {
    for (var e in Oe)
      Oe.hasOwnProperty(e) && !(e in t) && (t[e] = Oe[e]);
    St.forEach(function(i) {
      if (i.pluginName === t.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(t.pluginName, " more than once");
    }), St.push(t);
  },
  pluginEvent: function(t, e, i) {
    var n = this;
    this.eventCanceled = !1, i.cancel = function() {
      n.eventCanceled = !0;
    };
    var o = t + "Global";
    St.forEach(function(a) {
      e[a.pluginName] && (e[a.pluginName][o] && e[a.pluginName][o](it({
        sortable: e
      }, i)), e.options[a.pluginName] && e[a.pluginName][t] && e[a.pluginName][t](it({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, n) {
    St.forEach(function(r) {
      var c = r.pluginName;
      if (!(!t.options[c] && !r.initializeByDefault)) {
        var d = new r(t, e, t.options);
        d.sortable = t, d.options = t.options, t[c] = d, at(i, d.defaults);
      }
    });
    for (var o in t.options)
      if (t.options.hasOwnProperty(o)) {
        var a = this.modifyOption(t, o, t.options[o]);
        typeof a < "u" && (t.options[o] = a);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return St.forEach(function(n) {
      typeof n.eventProperties == "function" && at(i, n.eventProperties.call(e[n.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var n;
    return St.forEach(function(o) {
      t[o.pluginName] && o.optionListeners && typeof o.optionListeners[e] == "function" && (n = o.optionListeners[e].call(t[o.pluginName], i));
    }), n;
  }
};
function yo(s) {
  var t = s.sortable, e = s.rootEl, i = s.name, n = s.targetEl, o = s.cloneEl, a = s.toEl, r = s.fromEl, c = s.oldIndex, d = s.newIndex, u = s.oldDraggableIndex, l = s.newDraggableIndex, p = s.originalEvent, f = s.putSortable, h = s.extraEventProperties;
  if (t = t || e && e[V], !!t) {
    var g, m = t.options, v = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !st && !Jt ? g = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (g = document.createEvent("Event"), g.initEvent(i, !0, !0)), g.to = a || e, g.from = r || e, g.item = n || e, g.clone = o, g.oldIndex = c, g.newIndex = d, g.oldDraggableIndex = u, g.newDraggableIndex = l, g.originalEvent = p, g.pullMode = f ? f.lastPutMode : void 0;
    var S = it(it({}, h), Zt.getEventProperties(i, t));
    for (var $ in S)
      g[$] = S[$];
    e && e.dispatchEvent(g), m[v] && m[v].call(t, g);
  }
}
var bo = ["evt"], K = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, n = i.evt, o = uo(i, bo);
  Zt.pluginEvent.bind(w)(t, e, it({
    dragEl: y,
    parentEl: I,
    ghostEl: k,
    rootEl: D,
    nextEl: yt,
    lastDownEl: re,
    cloneEl: T,
    cloneHidden: dt,
    dragStarted: Mt,
    putSortable: F,
    activeSortable: w.active,
    originalEvent: n,
    oldIndex: Dt,
    oldDraggableIndex: Ut,
    newIndex: X,
    newDraggableIndex: ct,
    hideGhostForTarget: fn,
    unhideGhostForTarget: _n,
    cloneNowHidden: function() {
      dt = !0;
    },
    cloneNowShown: function() {
      dt = !1;
    },
    dispatchSortableEvent: function(r) {
      H({
        sortable: e,
        name: r,
        originalEvent: n
      });
    }
  }, o));
};
function H(s) {
  yo(it({
    putSortable: F,
    cloneEl: T,
    targetEl: y,
    rootEl: D,
    oldIndex: Dt,
    oldDraggableIndex: Ut,
    newIndex: X,
    newDraggableIndex: ct
  }, s));
}
var y, I, k, D, yt, re, T, dt, Dt, X, Ut, ct, ee, F, Et = !1, pe = !1, ge = [], mt, J, Pe, Me, Ii, Ri, Mt, $t, Ht, qt = !1, ie = !1, ce, W, Ne = [], Qe = !1, fe = [], Ae = typeof document < "u", ne = ci, Oi = Jt || st ? "cssFloat" : "float", wo = Ae && !on && !ci && "draggable" in document.createElement("div"), hn = function() {
  if (Ae) {
    if (st)
      return !1;
    var s = document.createElement("x");
    return s.style.cssText = "pointer-events:auto", s.style.pointerEvents === "auto";
  }
}(), pn = function(t, e) {
  var i = b(t), n = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), o = Ct(t, 0, e), a = Ct(t, 1, e), r = o && b(o), c = a && b(a), d = r && parseInt(r.marginLeft) + parseInt(r.marginRight) + M(o).width, u = c && parseInt(c.marginLeft) + parseInt(c.marginRight) + M(a).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (o && r.float && r.float !== "none") {
    var l = r.float === "left" ? "left" : "right";
    return a && (c.clear === "both" || c.clear === l) ? "vertical" : "horizontal";
  }
  return o && (r.display === "block" || r.display === "flex" || r.display === "table" || r.display === "grid" || d >= n && i[Oi] === "none" || a && i[Oi] === "none" && d + u > n) ? "vertical" : "horizontal";
}, xo = function(t, e, i) {
  var n = i ? t.left : t.top, o = i ? t.right : t.bottom, a = i ? t.width : t.height, r = i ? e.left : e.top, c = i ? e.right : e.bottom, d = i ? e.width : e.height;
  return n === r || o === c || n + a / 2 === r + d / 2;
}, ko = function(t, e) {
  var i;
  return ge.some(function(n) {
    var o = n[V].options.emptyInsertThreshold;
    if (!(!o || li(n))) {
      var a = M(n), r = t >= a.left - o && t <= a.right + o, c = e >= a.top - o && e <= a.bottom + o;
      if (r && c)
        return i = n;
    }
  }), i;
}, gn = function(t) {
  function e(o, a) {
    return function(r, c, d, u) {
      var l = r.options.group.name && c.options.group.name && r.options.group.name === c.options.group.name;
      if (o == null && (a || l))
        return !0;
      if (o == null || o === !1)
        return !1;
      if (a && o === "clone")
        return o;
      if (typeof o == "function")
        return e(o(r, c, d, u), a)(r, c, d, u);
      var p = (a ? r : c).options.group.name;
      return o === !0 || typeof o == "string" && o === p || o.join && o.indexOf(p) > -1;
    };
  }
  var i = {}, n = t.group;
  (!n || se(n) != "object") && (n = {
    name: n
  }), i.name = n.name, i.checkPull = e(n.pull, !0), i.checkPut = e(n.put), i.revertClone = n.revertClone, t.group = i;
}, fn = function() {
  !hn && k && b(k, "display", "none");
}, _n = function() {
  !hn && k && b(k, "display", "");
};
Ae && !on && document.addEventListener("click", function(s) {
  if (pe)
    return s.preventDefault(), s.stopPropagation && s.stopPropagation(), s.stopImmediatePropagation && s.stopImmediatePropagation(), pe = !1, !1;
}, !0);
var vt = function(t) {
  if (y) {
    t = t.touches ? t.touches[0] : t;
    var e = ko(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var n in t)
        t.hasOwnProperty(n) && (i[n] = t[n]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[V]._onDragOver(i);
    }
  }
}, So = function(t) {
  y && y.parentNode[V]._isOutsideThisEl(t.target);
};
function w(s, t) {
  if (!(s && s.nodeType && s.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(s));
  this.el = s, this.options = t = at({}, t), s[V] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(s.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return pn(s, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(a, r) {
      a.setData("Text", r.textContent);
    },
    dropBubble: !1,
    dragoverBubble: !1,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: !1,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: !1,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: !1,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    // Disabled on Safari: #1571; Enabled on Safari IOS: #2244
    supportPointer: w.supportPointer !== !1 && "PointerEvent" in window && (!jt || ci),
    emptyInsertThreshold: 5
  };
  Zt.initializePlugins(this, s, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  gn(t);
  for (var n in this)
    n.charAt(0) === "_" && typeof this[n] == "function" && (this[n] = this[n].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : wo, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? E(s, "pointerdown", this._onTapStart) : (E(s, "mousedown", this._onTapStart), E(s, "touchstart", this._onTapStart)), this.nativeDraggable && (E(s, "dragover", this), E(s, "dragenter", this)), ge.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), at(this, _o());
}
w.prototype = /** @lends Sortable.prototype */
{
  constructor: w,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && ($t = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, y) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, n = this.options, o = n.preventOnFilter, a = t.type, r = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, c = (r || t).target, d = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || c, u = n.filter;
      if (Io(i), !y && !(/mousedown|pointerdown/.test(a) && t.button !== 0 || n.disabled) && !d.isContentEditable && !(!this.nativeDraggable && jt && c && c.tagName.toUpperCase() === "SELECT") && (c = Z(c, n.draggable, i, !1), !(c && c.animated) && re !== c)) {
        if (Dt = Q(c), Ut = Q(c, n.draggable), typeof u == "function") {
          if (u.call(this, t, c, this)) {
            H({
              sortable: e,
              rootEl: d,
              name: "filter",
              targetEl: c,
              toEl: i,
              fromEl: i
            }), K("filter", e, {
              evt: t
            }), o && t.preventDefault();
            return;
          }
        } else if (u && (u = u.split(",").some(function(l) {
          if (l = Z(d, l.trim(), i, !1), l)
            return H({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: c,
              fromEl: i,
              toEl: i
            }), K("filter", e, {
              evt: t
            }), !0;
        }), u)) {
          o && t.preventDefault();
          return;
        }
        n.handle && !Z(d, n.handle, i, !1) || this._prepareDragStart(t, r, c);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var n = this, o = n.el, a = n.options, r = o.ownerDocument, c;
    if (i && !y && i.parentNode === o) {
      var d = M(i);
      if (D = o, y = i, I = y.parentNode, yt = y.nextSibling, re = i, ee = a.group, w.dragged = y, mt = {
        target: y,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, Ii = mt.clientX - d.left, Ri = mt.clientY - d.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, y.style["will-change"] = "all", c = function() {
        if (K("delayEnded", n, {
          evt: t
        }), w.eventCanceled) {
          n._onDrop();
          return;
        }
        n._disableDelayedDragEvents(), !Di && n.nativeDraggable && (y.draggable = !0), n._triggerDragStart(t, e), H({
          sortable: n,
          name: "choose",
          originalEvent: t
        }), Y(y, a.chosenClass, !0);
      }, a.ignore.split(",").forEach(function(u) {
        rn(y, u.trim(), Be);
      }), E(r, "dragover", vt), E(r, "mousemove", vt), E(r, "touchmove", vt), a.supportPointer ? (E(r, "pointerup", n._onDrop), !this.nativeDraggable && E(r, "pointercancel", n._onDrop)) : (E(r, "mouseup", n._onDrop), E(r, "touchend", n._onDrop), E(r, "touchcancel", n._onDrop)), Di && this.nativeDraggable && (this.options.touchStartThreshold = 4, y.draggable = !0), K("delayStart", this, {
        evt: t
      }), a.delay && (!a.delayOnTouchOnly || e) && (!this.nativeDraggable || !(Jt || st))) {
        if (w.eventCanceled) {
          this._onDrop();
          return;
        }
        a.supportPointer ? (E(r, "pointerup", n._disableDelayedDrag), E(r, "pointercancel", n._disableDelayedDrag)) : (E(r, "mouseup", n._disableDelayedDrag), E(r, "touchend", n._disableDelayedDrag), E(r, "touchcancel", n._disableDelayedDrag)), E(r, "mousemove", n._delayedDragTouchMoveHandler), E(r, "touchmove", n._delayedDragTouchMoveHandler), a.supportPointer && E(r, "pointermove", n._delayedDragTouchMoveHandler), n._dragStartTimer = setTimeout(c, a.delay);
      } else
        c();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    y && Be(y), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    A(t, "mouseup", this._disableDelayedDrag), A(t, "touchend", this._disableDelayedDrag), A(t, "touchcancel", this._disableDelayedDrag), A(t, "pointerup", this._disableDelayedDrag), A(t, "pointercancel", this._disableDelayedDrag), A(t, "mousemove", this._delayedDragTouchMoveHandler), A(t, "touchmove", this._delayedDragTouchMoveHandler), A(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? E(document, "pointermove", this._onTouchMove) : e ? E(document, "touchmove", this._onTouchMove) : E(document, "mousemove", this._onTouchMove) : (E(y, "dragend", this), E(D, "dragstart", this._onDragStart));
    try {
      document.selection ? le(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if (Et = !1, D && y) {
      K("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && E(document, "dragover", So);
      var i = this.options;
      !t && Y(y, i.dragClass, !1), Y(y, i.ghostClass, !0), w.active = this, t && this._appendGhost(), H({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (J) {
      this._lastX = J.clientX, this._lastY = J.clientY, fn();
      for (var t = document.elementFromPoint(J.clientX, J.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(J.clientX, J.clientY), t !== e); )
        e = t;
      if (y.parentNode[V]._isOutsideThisEl(t), e)
        do {
          if (e[V]) {
            var i = void 0;
            if (i = e[V]._onDragOver({
              clientX: J.clientX,
              clientY: J.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = sn(e));
      _n();
    }
  },
  _onTouchMove: function(t) {
    if (mt) {
      var e = this.options, i = e.fallbackTolerance, n = e.fallbackOffset, o = t.touches ? t.touches[0] : t, a = k && Tt(k, !0), r = k && a && a.a, c = k && a && a.d, d = ne && W && Ci(W), u = (o.clientX - mt.clientX + n.x) / (r || 1) + (d ? d[0] - Ne[0] : 0) / (r || 1), l = (o.clientY - mt.clientY + n.y) / (c || 1) + (d ? d[1] - Ne[1] : 0) / (c || 1);
      if (!w.active && !Et) {
        if (i && Math.max(Math.abs(o.clientX - this._lastX), Math.abs(o.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (k) {
        a ? (a.e += u - (Pe || 0), a.f += l - (Me || 0)) : a = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: u,
          f: l
        };
        var p = "matrix(".concat(a.a, ",").concat(a.b, ",").concat(a.c, ",").concat(a.d, ",").concat(a.e, ",").concat(a.f, ")");
        b(k, "webkitTransform", p), b(k, "mozTransform", p), b(k, "msTransform", p), b(k, "transform", p), Pe = u, Me = l, J = o;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!k) {
      var t = this.options.fallbackOnBody ? document.body : D, e = M(y, !0, ne, !0, t), i = this.options;
      if (ne) {
        for (W = t; b(W, "position") === "static" && b(W, "transform") === "none" && W !== document; )
          W = W.parentNode;
        W !== document.body && W !== document.documentElement ? (W === document && (W = et()), e.top += W.scrollTop, e.left += W.scrollLeft) : W = et(), Ne = Ci(W);
      }
      k = y.cloneNode(!0), Y(k, i.ghostClass, !1), Y(k, i.fallbackClass, !0), Y(k, i.dragClass, !0), b(k, "transition", ""), b(k, "transform", ""), b(k, "box-sizing", "border-box"), b(k, "margin", 0), b(k, "top", e.top), b(k, "left", e.left), b(k, "width", e.width), b(k, "height", e.height), b(k, "opacity", "0.8"), b(k, "position", ne ? "absolute" : "fixed"), b(k, "zIndex", "100000"), b(k, "pointerEvents", "none"), w.ghost = k, t.appendChild(k), b(k, "transform-origin", Ii / parseInt(k.style.width) * 100 + "% " + Ri / parseInt(k.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, n = t.dataTransfer, o = i.options;
    if (K("dragStart", this, {
      evt: t
    }), w.eventCanceled) {
      this._onDrop();
      return;
    }
    K("setupClone", this), w.eventCanceled || (T = dn(y), T.removeAttribute("id"), T.draggable = !1, T.style["will-change"] = "", this._hideClone(), Y(T, this.options.chosenClass, !1), w.clone = T), i.cloneId = le(function() {
      K("clone", i), !w.eventCanceled && (i.options.removeCloneOnHide || D.insertBefore(T, y), i._hideClone(), H({
        sortable: i,
        name: "clone"
      }));
    }), !e && Y(y, o.dragClass, !0), e ? (pe = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (A(document, "mouseup", i._onDrop), A(document, "touchend", i._onDrop), A(document, "touchcancel", i._onDrop), n && (n.effectAllowed = "move", o.setData && o.setData.call(i, n, y)), E(document, "drop", i), b(y, "transform", "translateZ(0)")), Et = !0, i._dragStartId = le(i._dragStarted.bind(i, e, t)), E(document, "selectstart", i), Mt = !0, window.getSelection().removeAllRanges(), jt && b(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, n, o, a, r = this.options, c = r.group, d = w.active, u = ee === c, l = r.sort, p = F || d, f, h = this, g = !1;
    if (Qe) return;
    function m(Rt, Sn) {
      K(Rt, h, it({
        evt: t,
        isOwner: u,
        axis: f ? "vertical" : "horizontal",
        revert: a,
        dragRect: n,
        targetRect: o,
        canSort: l,
        fromSortable: p,
        target: i,
        completed: S,
        onMove: function(gi, $n) {
          return oe(D, e, y, n, gi, M(gi), t, $n);
        },
        changed: $
      }, Sn));
    }
    function v() {
      m("dragOverAnimationCapture"), h.captureAnimationState(), h !== p && p.captureAnimationState();
    }
    function S(Rt) {
      return m("dragOverCompleted", {
        insertion: Rt
      }), Rt && (u ? d._hideClone() : d._showClone(h), h !== p && (Y(y, F ? F.options.ghostClass : d.options.ghostClass, !1), Y(y, r.ghostClass, !0)), F !== h && h !== w.active ? F = h : h === w.active && F && (F = null), p === h && (h._ignoreWhileAnimating = i), h.animateAll(function() {
        m("dragOverAnimationComplete"), h._ignoreWhileAnimating = null;
      }), h !== p && (p.animateAll(), p._ignoreWhileAnimating = null)), (i === y && !y.animated || i === e && !i.animated) && ($t = null), !r.dragoverBubble && !t.rootEl && i !== document && (y.parentNode[V]._isOutsideThisEl(t.target), !Rt && vt(t)), !r.dragoverBubble && t.stopPropagation && t.stopPropagation(), g = !0;
    }
    function $() {
      X = Q(y), ct = Q(y, r.draggable), H({
        sortable: h,
        name: "change",
        toEl: e,
        newIndex: X,
        newDraggableIndex: ct,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = Z(i, r.draggable, e, !0), m("dragOver"), w.eventCanceled) return g;
    if (y.contains(t.target) || i.animated && i.animatingX && i.animatingY || h._ignoreWhileAnimating === i)
      return S(!1);
    if (pe = !1, d && !r.disabled && (u ? l || (a = I !== D) : F === this || (this.lastPutMode = ee.checkPull(this, d, y, t)) && c.checkPut(this, d, y, t))) {
      if (f = this._getDirection(t, i) === "vertical", n = M(y), m("dragOverValid"), w.eventCanceled) return g;
      if (a)
        return I = D, v(), this._hideClone(), m("revert"), w.eventCanceled || (yt ? D.insertBefore(y, yt) : D.appendChild(y)), S(!0);
      var x = li(e, r.draggable);
      if (!x || Do(t, f, this) && !x.animated) {
        if (x === y)
          return S(!1);
        if (x && e === t.target && (i = x), i && (o = M(i)), oe(D, e, y, n, i, o, t, !!i) !== !1)
          return v(), x && x.nextSibling ? e.insertBefore(y, x.nextSibling) : e.appendChild(y), I = e, $(), S(!0);
      } else if (x && Eo(t, f, this)) {
        var j = Ct(e, 0, r, !0);
        if (j === y)
          return S(!1);
        if (i = j, o = M(i), oe(D, e, y, n, i, o, t, !1) !== !1)
          return v(), e.insertBefore(y, j), I = e, $(), S(!0);
      } else if (i.parentNode === e) {
        o = M(i);
        var N = 0, q, R = y.parentNode !== e, O = !xo(y.animated && y.toRect || n, i.animated && i.toRect || o, f), L = f ? "top" : "left", C = Li(i, "top", "top") || Li(y, "top", "top"), G = C ? C.scrollTop : void 0;
        $t !== i && (q = o[L], qt = !1, ie = !O && r.invertSwap || R), N = To(t, i, o, f, O ? 1 : r.swapThreshold, r.invertedSwapThreshold == null ? r.swapThreshold : r.invertedSwapThreshold, ie, $t === i);
        var tt;
        if (N !== 0) {
          var B = Q(y);
          do
            B -= N, tt = I.children[B];
          while (tt && (b(tt, "display") === "none" || tt === k));
        }
        if (N === 0 || tt === i)
          return S(!1);
        $t = i, Ht = N;
        var nt = i.nextElementSibling, rt = !1;
        rt = N === 1;
        var te = oe(D, e, y, n, i, o, t, rt);
        if (te !== !1)
          return (te === 1 || te === -1) && (rt = te === 1), Qe = !0, setTimeout(Ao, 30), v(), rt && !nt ? e.appendChild(y) : i.parentNode.insertBefore(y, rt ? nt : i), C && ln(C, 0, G - C.scrollTop), I = y.parentNode, q !== void 0 && !ie && (ce = Math.abs(q - M(i)[L])), $(), S(!0);
      }
      if (e.contains(y))
        return S(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    A(document, "mousemove", this._onTouchMove), A(document, "touchmove", this._onTouchMove), A(document, "pointermove", this._onTouchMove), A(document, "dragover", vt), A(document, "mousemove", vt), A(document, "touchmove", vt);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    A(t, "mouseup", this._onDrop), A(t, "touchend", this._onDrop), A(t, "pointerup", this._onDrop), A(t, "pointercancel", this._onDrop), A(t, "touchcancel", this._onDrop), A(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (X = Q(y), ct = Q(y, i.draggable), K("drop", this, {
      evt: t
    }), I = y && y.parentNode, X = Q(y), ct = Q(y, i.draggable), w.eventCanceled) {
      this._nulling();
      return;
    }
    Et = !1, ie = !1, qt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), Je(this.cloneId), Je(this._dragStartId), this.nativeDraggable && (A(document, "drop", this), A(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), jt && b(document.body, "user-select", ""), b(y, "transform", ""), t && (Mt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), k && k.parentNode && k.parentNode.removeChild(k), (D === I || F && F.lastPutMode !== "clone") && T && T.parentNode && T.parentNode.removeChild(T), y && (this.nativeDraggable && A(y, "dragend", this), Be(y), y.style["will-change"] = "", Mt && !Et && Y(y, F ? F.options.ghostClass : this.options.ghostClass, !1), Y(y, this.options.chosenClass, !1), H({
      sortable: this,
      name: "unchoose",
      toEl: I,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), D !== I ? (X >= 0 && (H({
      rootEl: I,
      name: "add",
      toEl: I,
      fromEl: D,
      originalEvent: t
    }), H({
      sortable: this,
      name: "remove",
      toEl: I,
      originalEvent: t
    }), H({
      rootEl: I,
      name: "sort",
      toEl: I,
      fromEl: D,
      originalEvent: t
    }), H({
      sortable: this,
      name: "sort",
      toEl: I,
      originalEvent: t
    })), F && F.save()) : X !== Dt && X >= 0 && (H({
      sortable: this,
      name: "update",
      toEl: I,
      originalEvent: t
    }), H({
      sortable: this,
      name: "sort",
      toEl: I,
      originalEvent: t
    })), w.active && ((X == null || X === -1) && (X = Dt, ct = Ut), H({
      sortable: this,
      name: "end",
      toEl: I,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    K("nulling", this), D = y = I = k = yt = T = re = dt = mt = J = Mt = X = ct = Dt = Ut = $t = Ht = F = ee = w.dragged = w.ghost = w.clone = w.active = null, fe.forEach(function(t) {
      t.checked = !0;
    }), fe.length = Pe = Me = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        y && (this._onDragOver(t), $o(t));
        break;
      case "selectstart":
        t.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function() {
    for (var t = [], e, i = this.el.children, n = 0, o = i.length, a = this.options; n < o; n++)
      e = i[n], Z(e, a.draggable, this.el, !1) && t.push(e.getAttribute(a.dataIdAttr) || Co(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, n = this.el;
    this.toArray().forEach(function(o, a) {
      var r = n.children[a];
      Z(r, this.options.draggable, n, !1) && (i[o] = r);
    }, this), e && this.captureAnimationState(), t.forEach(function(o) {
      i[o] && (n.removeChild(i[o]), n.appendChild(i[o]));
    }), e && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function() {
    var t = this.options.store;
    t && t.set && t.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function(t, e) {
    return Z(t, e || this.options.draggable, this.el, !1);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function(t, e) {
    var i = this.options;
    if (e === void 0)
      return i[t];
    var n = Zt.modifyOption(this, t, e);
    typeof n < "u" ? i[t] = n : i[t] = e, t === "group" && gn(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    K("destroy", this);
    var t = this.el;
    t[V] = null, A(t, "mousedown", this._onTapStart), A(t, "touchstart", this._onTapStart), A(t, "pointerdown", this._onTapStart), this.nativeDraggable && (A(t, "dragover", this), A(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), ge.splice(ge.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!dt) {
      if (K("hideClone", this), w.eventCanceled) return;
      b(T, "display", "none"), this.options.removeCloneOnHide && T.parentNode && T.parentNode.removeChild(T), dt = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (dt) {
      if (K("showClone", this), w.eventCanceled) return;
      y.parentNode == D && !this.options.group.revertClone ? D.insertBefore(T, y) : yt ? D.insertBefore(T, yt) : D.appendChild(T), this.options.group.revertClone && this.animate(y, T), b(T, "display", ""), dt = !1;
    }
  }
};
function $o(s) {
  s.dataTransfer && (s.dataTransfer.dropEffect = "move"), s.cancelable && s.preventDefault();
}
function oe(s, t, e, i, n, o, a, r) {
  var c, d = s[V], u = d.options.onMove, l;
  return window.CustomEvent && !st && !Jt ? c = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (c = document.createEvent("Event"), c.initEvent("move", !0, !0)), c.to = t, c.from = s, c.dragged = e, c.draggedRect = i, c.related = n || t, c.relatedRect = o || M(t), c.willInsertAfter = r, c.originalEvent = a, s.dispatchEvent(c), u && (l = u.call(d, c, a)), l;
}
function Be(s) {
  s.draggable = !1;
}
function Ao() {
  Qe = !1;
}
function Eo(s, t, e) {
  var i = M(Ct(e.el, 0, e.options, !0)), n = un(e.el, e.options, k), o = 10;
  return t ? s.clientX < n.left - o || s.clientY < i.top && s.clientX < i.right : s.clientY < n.top - o || s.clientY < i.bottom && s.clientX < i.left;
}
function Do(s, t, e) {
  var i = M(li(e.el, e.options.draggable)), n = un(e.el, e.options, k), o = 10;
  return t ? s.clientX > n.right + o || s.clientY > i.bottom && s.clientX > i.left : s.clientY > n.bottom + o || s.clientX > i.right && s.clientY > i.top;
}
function To(s, t, e, i, n, o, a, r) {
  var c = i ? s.clientY : s.clientX, d = i ? e.height : e.width, u = i ? e.top : e.left, l = i ? e.bottom : e.right, p = !1;
  if (!a) {
    if (r && ce < d * n) {
      if (!qt && (Ht === 1 ? c > u + d * o / 2 : c < l - d * o / 2) && (qt = !0), qt)
        p = !0;
      else if (Ht === 1 ? c < u + ce : c > l - ce)
        return -Ht;
    } else if (c > u + d * (1 - n) / 2 && c < l - d * (1 - n) / 2)
      return Lo(t);
  }
  return p = p || a, p && (c < u + d * o / 2 || c > l - d * o / 2) ? c > u + d / 2 ? 1 : -1 : 0;
}
function Lo(s) {
  return Q(y) < Q(s) ? 1 : -1;
}
function Co(s) {
  for (var t = s.tagName + s.className + s.src + s.href + s.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function Io(s) {
  fe.length = 0;
  for (var t = s.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && fe.push(i);
  }
}
function le(s) {
  return setTimeout(s, 0);
}
function Je(s) {
  return clearTimeout(s);
}
Ae && E(document, "touchmove", function(s) {
  (w.active || Et) && s.cancelable && s.preventDefault();
});
w.utils = {
  on: E,
  off: A,
  css: b,
  find: rn,
  is: function(t, e) {
    return !!Z(t, e, t, !1);
  },
  extend: go,
  throttle: cn,
  closest: Z,
  toggleClass: Y,
  clone: dn,
  index: Q,
  nextTick: le,
  cancelNextTick: Je,
  detectDirection: pn,
  getChild: Ct,
  expando: V
};
w.get = function(s) {
  return s[V];
};
w.mount = function() {
  for (var s = arguments.length, t = new Array(s), e = 0; e < s; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (w.utils = it(it({}, w.utils), i.utils)), Zt.mount(i);
  });
};
w.create = function(s, t) {
  return new w(s, t);
};
w.version = ho;
var P = [], Nt, Ze, ti = !1, ze, Fe, _e, Bt;
function Ro() {
  function s() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0
    };
    for (var t in this)
      t.charAt(0) === "_" && typeof this[t] == "function" && (this[t] = this[t].bind(this));
  }
  return s.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? E(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? E(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? E(document, "touchmove", this._handleFallbackAutoScroll) : E(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? A(document, "dragover", this._handleAutoScroll) : (A(document, "pointermove", this._handleFallbackAutoScroll), A(document, "touchmove", this._handleFallbackAutoScroll), A(document, "mousemove", this._handleFallbackAutoScroll)), Pi(), de(), fo();
    },
    nulling: function() {
      _e = Ze = Nt = ti = Bt = ze = Fe = null, P.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var n = this, o = (e.touches ? e.touches[0] : e).clientX, a = (e.touches ? e.touches[0] : e).clientY, r = document.elementFromPoint(o, a);
      if (_e = e, i || this.options.forceAutoScrollFallback || Jt || st || jt) {
        je(e, this.options, r, i);
        var c = ht(r, !0);
        ti && (!Bt || o !== ze || a !== Fe) && (Bt && Pi(), Bt = setInterval(function() {
          var d = ht(document.elementFromPoint(o, a), !0);
          d !== c && (c = d, de()), je(e, n.options, d, i);
        }, 10), ze = o, Fe = a);
      } else {
        if (!this.options.bubbleScroll || ht(r, !0) === et()) {
          de();
          return;
        }
        je(e, this.options, ht(r, !1), !1);
      }
    }
  }, at(s, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function de() {
  P.forEach(function(s) {
    clearInterval(s.pid);
  }), P = [];
}
function Pi() {
  clearInterval(Bt);
}
var je = cn(function(s, t, e, i) {
  if (t.scroll) {
    var n = (s.touches ? s.touches[0] : s).clientX, o = (s.touches ? s.touches[0] : s).clientY, a = t.scrollSensitivity, r = t.scrollSpeed, c = et(), d = !1, u;
    Ze !== e && (Ze = e, de(), Nt = t.scroll, u = t.scrollFn, Nt === !0 && (Nt = ht(e, !0)));
    var l = 0, p = Nt;
    do {
      var f = p, h = M(f), g = h.top, m = h.bottom, v = h.left, S = h.right, $ = h.width, x = h.height, j = void 0, N = void 0, q = f.scrollWidth, R = f.scrollHeight, O = b(f), L = f.scrollLeft, C = f.scrollTop;
      f === c ? (j = $ < q && (O.overflowX === "auto" || O.overflowX === "scroll" || O.overflowX === "visible"), N = x < R && (O.overflowY === "auto" || O.overflowY === "scroll" || O.overflowY === "visible")) : (j = $ < q && (O.overflowX === "auto" || O.overflowX === "scroll"), N = x < R && (O.overflowY === "auto" || O.overflowY === "scroll"));
      var G = j && (Math.abs(S - n) <= a && L + $ < q) - (Math.abs(v - n) <= a && !!L), tt = N && (Math.abs(m - o) <= a && C + x < R) - (Math.abs(g - o) <= a && !!C);
      if (!P[l])
        for (var B = 0; B <= l; B++)
          P[B] || (P[B] = {});
      (P[l].vx != G || P[l].vy != tt || P[l].el !== f) && (P[l].el = f, P[l].vx = G, P[l].vy = tt, clearInterval(P[l].pid), (G != 0 || tt != 0) && (d = !0, P[l].pid = setInterval((function() {
        i && this.layer === 0 && w.active._onTouchMove(_e);
        var nt = P[this.layer].vy ? P[this.layer].vy * r : 0, rt = P[this.layer].vx ? P[this.layer].vx * r : 0;
        typeof u == "function" && u.call(w.dragged.parentNode[V], rt, nt, s, _e, P[this.layer].el) !== "continue" || ln(P[this.layer].el, rt, nt);
      }).bind({
        layer: l
      }), 24))), l++;
    } while (t.bubbleScroll && p !== c && (p = ht(p, !1)));
    ti = d;
  }
}, 30), mn = function(t) {
  var e = t.originalEvent, i = t.putSortable, n = t.dragEl, o = t.activeSortable, a = t.dispatchSortableEvent, r = t.hideGhostForTarget, c = t.unhideGhostForTarget;
  if (e) {
    var d = i || o;
    r();
    var u = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, l = document.elementFromPoint(u.clientX, u.clientY);
    c(), d && !d.el.contains(l) && (a("spill"), this.onSpill({
      dragEl: n,
      putSortable: i
    }));
  }
};
function di() {
}
di.prototype = {
  startIndex: null,
  dragStart: function(t) {
    var e = t.oldDraggableIndex;
    this.startIndex = e;
  },
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var n = Ct(this.sortable.el, this.startIndex, this.options);
    n ? this.sortable.el.insertBefore(e, n) : this.sortable.el.appendChild(e), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: mn
};
at(di, {
  pluginName: "revertOnSpill"
});
function ui() {
}
ui.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, n = i || this.sortable;
    n.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), n.animateAll();
  },
  drop: mn
};
at(ui, {
  pluginName: "removeOnSpill"
});
w.mount(new Ro());
w.mount(ui, di);
function Oo(s) {
  const t = s.toLowerCase(), e = {
    kitchen: ["kitchen", "kitchenette"],
    bedroom: ["bedroom", "bed", "master bedroom", "guest room", "kids room"],
    bathroom: ["bathroom", "bath", "half bath", "powder room"],
    living: ["living room", "family room", "den"],
    dining: ["dining room", "dining"],
    office: ["office", "study", "home office"],
    garage: ["garage", "carport"],
    patio: ["patio", "deck", "porch"],
    utility: ["laundry", "utility room"],
    storage: ["closet", "pantry", "attic"],
    gym: ["gym", "exercise room"],
    theater: ["media room", "theater"]
  }, i = {
    kitchen: "mdi:silverware-fork-knife",
    bedroom: "mdi:bed",
    bathroom: "mdi:shower",
    living: "mdi:sofa",
    dining: "mdi:table-furniture",
    office: "mdi:desk",
    garage: "mdi:garage",
    patio: "mdi:flower",
    utility: "mdi:washing-machine",
    storage: "mdi:package-variant",
    gym: "mdi:dumbbell",
    theater: "mdi:theater"
  };
  for (const [n, o] of Object.entries(e))
    if (o.some((a) => t.includes(a)))
      return i[n] ?? null;
  return null;
}
function Po(s) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[s] ?? "mdi:map-marker";
}
function Mo(s) {
  const t = String(s ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function vn(s) {
  var n;
  const t = (n = s.modules) == null ? void 0 : n._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = Oo(s.name);
  if (e) return e;
  const i = Mo(t == null ? void 0 : t.type);
  return Po(i);
}
const No = 24, Bo = 0.18, zo = 6;
function Fo(s, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const n of s) {
      const o = n.location.parent_id;
      o && e.has(o) && !e.has(n.location.id) && (e.add(n.location.id), i = !0);
    }
  }
  return e;
}
function Mi(s, t) {
  const e = new Map(s.map((l) => [l.id, l])), i = /* @__PURE__ */ new Map(), n = (l) => {
    const p = l.parent_id;
    return !p || p === l.id || !e.has(p) ? null : p;
  };
  for (const l of s) {
    const p = n(l);
    i.has(p) || i.set(p, []), i.get(p).push(l);
  }
  const o = [], a = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), d = [...i.get(null) || []];
  for (; d.length; ) {
    const l = d.pop();
    if (!r.has(l.id)) {
      r.add(l.id);
      for (const p of i.get(l.id) || [])
        d.push(p);
    }
  }
  function u(l, p) {
    const f = i.get(l) || [];
    for (const h of f) {
      if (a.has(h.id)) continue;
      a.add(h.id);
      const m = (i.get(h.id) || []).length > 0, v = t.has(h.id);
      o.push({ location: h, depth: p, hasChildren: m, isExpanded: v }), v && m && u(h.id, p + 1);
    }
  }
  u(null, 0);
  for (const l of s) {
    if (r.has(l.id) || a.has(l.id)) continue;
    a.add(l.id);
    const f = (i.get(l.id) || []).length > 0, h = t.has(l.id);
    o.push({ location: l, depth: 0, hasChildren: f, isExpanded: h }), h && f && u(l.id, 1);
  }
  return o;
}
function Ni(s, t, e, i) {
  if (i) {
    const r = s.left;
    if (t >= r && t < r + No) return "outdent";
  }
  const n = e - s.top, o = Math.max(s.height, 1), a = Math.min(
    o / 3,
    Math.max(zo, o * Bo)
  );
  return n < a ? "before" : n >= o - a ? "after" : "inside";
}
function jo(s, t, e, i, n) {
  const o = Fo(s, t), a = s.filter((l) => !o.has(l.location.id)), r = a.find((l) => l.location.id === i);
  if (!r) return { parentId: e, siblingIndex: 0 };
  const c = n === "inside" ? i : r.location.parent_id, d = a.filter((l) => l.location.parent_id === c), u = d.findIndex((l) => l.location.id === i);
  return n === "inside" ? { parentId: i, siblingIndex: d.length } : n === "before" ? { parentId: c, siblingIndex: u >= 0 ? u : 0 } : n === "after" ? { parentId: c, siblingIndex: Math.min(u >= 0 ? u + 1 : d.length, d.length) } : { parentId: c, siblingIndex: u >= 0 ? u : 0 };
}
const Bi = "application/x-topomation-entity-id", ve = class ve extends gt {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveRelatedId(t) {
    var a;
    const e = ((a = t.dragged) == null ? void 0 : a.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const n = i.getAttribute("data-id") || void 0;
    if (n && n !== e && !Ye(this.locations, e, n))
      return n;
    let o = i;
    for (; o; ) {
      if (o.classList.contains("tree-item")) {
        const r = o.getAttribute("data-id") || void 0;
        if (r && r !== e && !Ye(this.locations, e, r))
          return r;
      }
      o = t.willInsertAfter ? o.nextElementSibling : o.previousElementSibling;
    }
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._sortable) == null || t.destroy(), this._sortable = void 0, this._boundDragOver = void 0, this._draggedId = void 0, this._entityDropTargetId = void 0;
  }
  updated(t) {
    super.updated(t), (t.has("locations") || t.has("version")) && (this._cleanupDuplicateTreeItems(), this._isDragging || this._initializeSortable());
  }
  _initializeExpansion() {
    if (this.locations.length === 0) return;
    const t = /* @__PURE__ */ new Set();
    for (const e of this.locations)
      e.parent_id && t.add(e.parent_id);
    if (!this._hasInitializedExpansion)
      this._expandedIds = /* @__PURE__ */ new Set(), this._hasInitializedExpansion = !0;
    else {
      const e = /* @__PURE__ */ new Set();
      for (const i of this._expandedIds)
        t.has(i) && e.add(i);
      this._expandedIds = e;
    }
  }
  _initializeSortable() {
    var t;
    (t = this._sortable) == null || t.destroy(), this.updateComplete.then(() => {
      var i;
      const e = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      e && (this._sortable = w.create(e, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: (n) => {
          var o;
          this._isDragging = !0, this._dropIndicator = void 0, this._entityDropTargetId = void 0, this._draggedId = ((o = n.item) == null ? void 0 : o.getAttribute("data-id")) ?? void 0, this._boundDragOver = this._handleContinuousDragOver.bind(this), e.addEventListener("dragover", this._boundDragOver);
        },
        onMove: (n) => {
          var r;
          const o = ((r = n.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, a = n.related;
          if (o && (a != null && a.classList.contains("tree-item"))) {
            const c = this._resolveRelatedId(n) ?? a.getAttribute("data-id") ?? void 0;
            if (!c || c === o)
              return this._activeDropTarget = void 0, this._dropIndicator = void 0, !0;
            const d = a.getBoundingClientRect(), u = n.originalEvent, l = typeof (u == null ? void 0 : u.clientX) == "number" ? u.clientX : d.left + d.width / 2, p = typeof (u == null ? void 0 : u.clientY) == "number" ? u.clientY : d.top + d.height / 2, f = this.locations.find((v) => v.id === o), h = (f == null ? void 0 : f.parent_id) ?? null, m = Ni(d, l, p, c === h);
            this._activeDropTarget = { relatedId: c, zone: m }, this._updateDropIndicator(o, a, m);
          } else
            this._activeDropTarget = void 0, this._dropIndicator = void 0;
          return !0;
        },
        onEnd: (n) => {
          this._isDragging = !1, this._dropIndicator = void 0, this._entityDropTargetId = void 0, this._boundDragOver && (e.removeEventListener("dragover", this._boundDragOver), this._boundDragOver = void 0), this._handleDragEnd(n), this._activeDropTarget = void 0, this._draggedId = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(t) {
    const { item: e } = t, i = e.getAttribute("data-id");
    if (!i) return;
    const n = this.locations.find((l) => l.id === i);
    if (!n) return;
    const o = this._activeDropTarget;
    if (!o) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    const a = Mi(this.locations, this._expandedIds), r = jo(
      a,
      i,
      n.parent_id,
      o.relatedId,
      o.zone
    ), { parentId: c, siblingIndex: d } = r, u = a.filter((l) => l.location.parent_id === n.parent_id).findIndex((l) => l.location.id === i);
    if (c === n.parent_id && d === u) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!Yn({ locations: this.locations, locationId: i, newParentId: c })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: i, newParentId: c, newIndex: d },
      bubbles: !0,
      composed: !0
    }));
  }
  _handleContinuousDragOver(t) {
    var u, l;
    t.preventDefault();
    const e = this._draggedId;
    if (!e) return;
    const i = (l = (u = t.target) == null ? void 0 : u.closest) == null ? void 0 : l.call(u, ".tree-item");
    if (!i) return;
    const n = i.getAttribute("data-id");
    if (!n || n === e) return;
    const o = i.getBoundingClientRect(), a = this.locations.find((p) => p.id === e), r = (a == null ? void 0 : a.parent_id) ?? null, c = n === r, d = Ni(o, t.clientX, t.clientY, c);
    this._activeDropTarget = { relatedId: n, zone: d }, this._updateDropIndicator(e, i, d);
  }
  _restoreTreeAfterCancelledDrop() {
    this._dropIndicator = void 0, this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _updateDropIndicator(t, e, i) {
    var p;
    const n = (p = this.shadowRoot) == null ? void 0 : p.querySelector(".tree-list");
    if (!e || !n) {
      this._dropIndicator = void 0;
      return;
    }
    const o = n.getBoundingClientRect(), a = e.getBoundingClientRect(), r = i === "inside" ? "child" : i === "outdent" ? "outdent" : "sibling", c = i === "inside" ? "Child" : i === "outdent" ? "Outdent" : i === "after" ? "After" : "Before";
    let d = a.left - o.left + 6;
    i === "inside" && (d += 24), i === "outdent" && (d -= 24), d = Math.max(8, Math.min(d, o.width - 44));
    const u = Math.max(36, o.width - d - 8), l = i === "after" ? a.bottom - o.top : i === "before" ? a.top - o.top : i === "inside" ? a.bottom - o.top : a.top - o.top;
    this._dropIndicator = { top: l, left: d, width: u, intent: r, label: c };
  }
  _cleanupDuplicateTreeItems() {
    var n;
    const t = (n = this.shadowRoot) == null ? void 0 : n.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const o of e) {
      const a = o.getAttribute("data-id");
      if (a) {
        if (i.has(a)) {
          o.remove();
          continue;
        }
        i.add(a);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return _`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? _`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : _`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Mi(this._visibleTreeLocations(), this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return _`
      <div class="tree-list">
        ${Xe(
      t,
      (n) => `${this.version}:${n.location.id}:${n.depth}`,
      (n) => this._renderItem(
        n,
        e[n.location.id] || "unknown",
        i[n.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
        ${this._dropIndicator ? _`
              <div
                class="drop-indicator ${this._dropIndicator.intent}"
                style=${`top:${this._dropIndicator.top}px;left:${this._dropIndicator.left}px;width:${this._dropIndicator.width}px;`}
              >
                <div class="drop-indicator-line"></div>
                <div class="drop-indicator-label">${this._dropIndicator.label}</div>
              </div>
            ` : ""}
      </div>
    `;
  }
  _renderItem(t, e, i) {
    var $;
    const { location: n, depth: o, hasChildren: a, isExpanded: r } = t, c = this.selectedId === n.id, d = this._editingId === n.id, u = o * 24, l = U(n), p = n.is_explicit_root ? "root" : l, f = n.is_explicit_root ? "home root" : l, h = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", g = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", m = (($ = this.occupancyStates) == null ? void 0 : $[n.id]) === !0, v = "mdi:home-switch-outline", S = m ? "Set vacant" : "Set occupied";
    return _`
      <div
        class="tree-item ${c ? "selected" : ""} ${l === "floor" ? "floor-item" : ""} ${this._entityDropTargetId === n.id ? "entity-drop-target" : ""}"
        data-id=${n.id}
        style="margin-left: ${u}px"
        @click=${(x) => this._handleClick(x, n)}
        @dragover=${(x) => this._handleEntityDragOver(x, n.id)}
        @dragleave=${(x) => this._handleEntityDragLeave(x, n.id)}
        @drop=${(x) => this._handleEntityDrop(x, n.id)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder. Drop on top/middle/bottom of a row for before/child/after." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${r ? "expanded" : ""} ${a ? "" : "hidden"}"
          @click=${(x) => this._handleExpand(x, n.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(n)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${e}"
          title=${this._getOccupancyStatusLabel(e)}
        ></div>

        ${d ? _`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(x) => this._editingValue = x.target.value}
                  @blur=${() => this._finishEditing(n.id)}
                  @keydown=${(x) => this._handleEditKeydown(x, n.id)}
                  @click=${(x) => x.stopPropagation()} />` : _`<div
              class="location-name"
              @dblclick=${this.allowRename ? (x) => this._startEditing(x, n) : () => {
    }}
            >${n.name}</div>`}

        <span class="type-badge ${p}">${f}</span>

        ${n.is_explicit_root || this.readOnly ? "" : _`
              <button
                class="occupancy-btn"
                title=${S}
                @click=${(x) => this._handleOccupancyToggle(x, n, m)}
              >
                <ha-icon .icon=${v}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${g}
                @click=${(x) => this._handleLockToggle(x, n, i)}
              >
                <ha-icon .icon=${h}></ha-icon>
              </button>
            `}
      </div>
    `;
  }
  _getOccupancyStatusLabel(t) {
    return t === "occupied" ? "Occupied" : t === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const t = {}, e = new Map(this.locations.map((a) => [a.id, a])), i = /* @__PURE__ */ new Map();
    for (const a of this.locations)
      a.parent_id && (i.has(a.parent_id) || i.set(a.parent_id, []), i.get(a.parent_id).push(a.id));
    const n = /* @__PURE__ */ new Map(), o = (a) => {
      var f;
      const r = n.get(a);
      if (r) return r;
      if (!e.has(a)) return "unknown";
      const c = (f = this.occupancyStates) == null ? void 0 : f[a], d = c === !0 ? "occupied" : c === !1 ? "vacant" : "unknown", u = i.get(a) || [];
      if (!u.length)
        return n.set(a, d), d;
      const l = u.map((h) => o(h));
      let p;
      return d === "occupied" || l.includes("occupied") ? p = "occupied" : d === "vacant" || l.length > 0 && l.every((h) => h === "vacant") ? p = "vacant" : p = "unknown", n.set(a, p), p;
    };
    for (const a of this.locations)
      t[a.id] = o(a.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const n of Object.values(t)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if (o.device_class !== "occupancy") continue;
      const a = o.location_id;
      if (!a) continue;
      const r = o.locked_by;
      e[String(a)] = {
        isLocked: !!o.is_locked,
        lockedBy: Array.isArray(r) ? r.map((c) => String(c)) : []
      };
    }
    return e;
  }
  _visibleTreeLocations() {
    const t = Se(this.locations);
    return this.locations.filter(
      (e) => !this._isManagedShadowLocation(e, t)
    );
  }
  _isManagedShadowLocation(t, e) {
    return $e(t, e);
  }
  _getIcon(t) {
    var e, i, n;
    return t.ha_area_id && ((n = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t.ha_area_id]) != null && n.icon) ? this.hass.areas[t.ha_area_id].icon : vn(t);
  }
  _hasEntityDragPayload(t) {
    var i;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.types) || []);
    return e.includes(Bi) ? !0 : !this._isDragging && e.includes("text/plain");
  }
  _readEntityIdFromDrop(t) {
    var n, o;
    const e = (n = t.dataTransfer) == null ? void 0 : n.getData(Bi);
    if (e) return e;
    const i = ((o = t.dataTransfer) == null ? void 0 : o.getData("text/plain")) || "";
    return i.includes(".") ? i : void 0;
  }
  _handleEntityDragOver(t, e) {
    this._hasEntityDragPayload(t) && (t.preventDefault(), t.dataTransfer && (t.dataTransfer.dropEffect = "move"), this._entityDropTargetId = e);
  }
  _handleEntityDragLeave(t, e) {
    var n;
    if (!this._hasEntityDragPayload(t)) return;
    const i = t.relatedTarget;
    (n = i == null ? void 0 : i.closest) != null && n.call(i, `[data-id="${e}"]`) || this._entityDropTargetId === e && (this._entityDropTargetId = void 0);
  }
  _handleEntityDrop(t, e) {
    const i = this._readEntityIdFromDrop(t);
    i && (t.preventDefault(), t.stopPropagation(), this._entityDropTargetId = void 0, this.dispatchEvent(
      new CustomEvent("entity-dropped", {
        detail: { entityId: i, targetLocationId: e },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleClick(t, e) {
    const i = t.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".lock-btn") || i.closest(".occupancy-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: e.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(t, e) {
    t.stopPropagation();
    const i = new Set(this._expandedIds);
    if (i.has(e)) {
      i.delete(e);
      const n = [e], o = /* @__PURE__ */ new Set();
      for (; n.length; ) {
        const a = n.pop();
        if (!o.has(a)) {
          o.add(a);
          for (const r of this.locations)
            r.parent_id === a && (i.delete(r.id), n.push(r.id));
        }
      }
    } else
      i.add(e);
    this._expandedIds = i;
  }
  _startEditing(t, e) {
    this.allowRename && (t.stopPropagation(), this._editingId = e.id, this._editingValue = e.name, this.updateComplete.then(() => {
      var n;
      const i = (n = this.shadowRoot) == null ? void 0 : n.querySelector(".location-name-input");
      i == null || i.focus(), i == null || i.select();
    }));
  }
  _handleEditKeydown(t, e) {
    t.key === "Enter" ? (t.preventDefault(), this._finishEditing(e)) : t.key === "Escape" && (this._editingId = void 0);
  }
  _finishEditing(t) {
    var i;
    if (this._editingId !== t) return;
    const e = this._editingValue.trim();
    this._editingId = void 0, !(!e || e === ((i = this.locations.find((n) => n.id === t)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: t, newName: e }, bubbles: !0, composed: !0 }));
  }
  _handleDelete(t, e) {
    this.readOnly || e.is_explicit_root || (t.stopPropagation(), confirm(`Delete "${e.name}"?`) && this.dispatchEvent(new CustomEvent("location-delete", { detail: { location: e }, bubbles: !0, composed: !0 })));
  }
  _handleCreate() {
    this.readOnly || this.dispatchEvent(new CustomEvent("location-create", { bubbles: !0, composed: !0 }));
  }
  _handleLockToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-lock-toggle", {
        detail: {
          locationId: e.id,
          lock: !i.isLocked
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOccupancyToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: {
          locationId: e.id,
          occupied: !i
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOpenSettings(t) {
    var i;
    t.preventDefault();
    const e = (i = this.hass) == null ? void 0 : i.navigate;
    typeof e == "function" ? e("/config/areas") : window.location.href = "/config/areas";
  }
};
ve.properties = {
  hass: { attribute: !1 },
  locations: { attribute: !1 },
  version: { type: Number },
  selectedId: {},
  occupancyStates: { attribute: !1 },
  readOnly: { type: Boolean },
  allowMove: { type: Boolean },
  allowRename: { type: Boolean },
  // Internal state
  _expandedIds: { state: !0 },
  _editingId: { state: !0 },
  _editingValue: { state: !0 },
  _isDragging: { state: !0 },
  _dropIndicator: { state: !0 },
  _entityDropTargetId: { state: !0 }
}, ve.styles = [
  ke,
  Yt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        position: relative;
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .drop-indicator {
        position: absolute;
        pointer-events: none;
        z-index: 5;
      }

      .drop-indicator-line {
        height: 2px;
        width: 100%;
        border-radius: 999px;
        background: var(--primary-color);
        box-shadow: 0 0 0 1px rgba(var(--rgb-primary-color), 0.18);
      }

      .drop-indicator::before {
        content: "";
        position: absolute;
        left: -6px;
        top: -4px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
      }

      .drop-indicator-label {
        position: absolute;
        top: -18px;
        left: 0;
        padding: 1px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--card-background-color);
        background: rgba(var(--rgb-primary-color), 0.95);
        white-space: nowrap;
      }

      .drop-indicator.sibling .drop-indicator-label {
        background: rgba(var(--rgb-primary-color), 0.95);
      }

      .drop-indicator.child .drop-indicator-label {
        background: rgba(var(--rgb-success-color), 0.95);
      }

      .drop-indicator.outdent .drop-indicator-label {
        background: rgba(var(--rgb-warning-color), 0.95);
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
        color: var(--primary-text-color);
        gap: var(--spacing-xs);
        min-height: 36px;
      }

      .tree-item:hover {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
      }

      .tree-item.selected {
        background: rgba(var(--rgb-primary-color), 0.12);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tree-item.selected:hover {
        background: rgba(var(--rgb-primary-color), 0.2);
      }

      .tree-item.entity-drop-target {
        background: rgba(var(--rgb-success-color), 0.18);
        box-shadow: inset 0 0 0 1px rgba(var(--rgb-success-color), 0.45);
      }

      .drag-handle {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.35;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        margin-right: var(--spacing-xs);
      }

      .tree-item:hover .drag-handle {
        opacity: 0.9;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .drag-handle.disabled {
        pointer-events: none;
      }

      .expand-btn {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        padding: 0;
        transition: transform 0.2s;
      }

      .expand-btn.expanded {
        transform: rotate(90deg);
      }

      .expand-btn.hidden {
        visibility: hidden;
      }

      .location-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .tree-item.selected .location-icon {
        color: var(--primary-color);
      }

      .occupancy-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .occupancy-dot.occupied {
        background: #22c55e;
        border-color: #16a34a;
      }

      .occupancy-dot.vacant {
        background: #d1d5db;
        border-color: #9ca3af;
      }

      .occupancy-dot.unknown {
        background: #f59e0b;
        border-color: #d97706;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .location-name-input {
        flex: 1;
        background: var(--card-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 14px;
        color: var(--primary-text-color);
        outline: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: var(--spacing-sm);
        flex-shrink: 0;
      }

      .type-badge.floor {
        background: rgba(var(--rgb-primary-color), 0.15);
        color: var(--primary-color);
      }

      .type-badge.area {
        background: rgba(var(--rgb-warning-color), 0.15);
        color: var(--warning-color);
      }

      .type-badge.building {
        background: rgba(var(--rgb-success-color), 0.15);
        color: var(--success-color);
      }

      .type-badge.grounds {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .type-badge.proxy {
        background: rgba(var(--rgb-secondary-text-color, 120, 120, 120), 0.2);
        color: var(--text-secondary-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .tree-item.selected .type-badge.building {
        background: var(--success-color);
        color: white;
      }

      .tree-item.selected .type-badge.grounds {
        background: var(--info-color);
        color: white;
      }

      .tree-item.selected .type-badge.proxy {
        background: var(--text-secondary-color);
        color: var(--card-background-color);
      }

      .type-badge.root {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.root {
        background: var(--info-color);
        color: white;
      }

      .delete-btn {
        opacity: 0.6;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .delete-btn {
        opacity: 1;
      }

      .tree-item.selected .delete-btn {
        opacity: 1;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .lock-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .lock-btn,
      .tree-item.selected .lock-btn {
        opacity: 1;
      }

      .lock-btn.locked {
        color: var(--warning-color);
      }

      .lock-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .occupancy-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .occupancy-btn,
      .tree-item.selected .occupancy-btn {
        opacity: 1;
      }

      .occupancy-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .sortable-ghost {
        opacity: 0.5;
        background: rgba(var(--rgb-primary-color), 0.12);
      }

      .sortable-chosen {
        background: rgba(var(--rgb-primary-color), 0.08);
      }
    `
];
let ei = ve;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", ei);
const ut = 30 * 60, zi = 5 * 60;
function yn(s) {
  if (!s) return "";
  const t = s.indexOf(".");
  return t >= 0 ? s.slice(0, t) : "";
}
function Wo(s) {
  return ["door", "garage_door", "opening", "window"].includes(s || "");
}
function Uo(s) {
  return ["presence", "occupancy"].includes(s || "");
}
function Ho(s) {
  return s === "motion";
}
function bn(s) {
  return s === "media_player";
}
function wn(s) {
  var i;
  const t = yn(s == null ? void 0 : s.entity_id), e = (i = s == null ? void 0 : s.attributes) == null ? void 0 : i.device_class;
  if (bn(t))
    return {
      entity_id: (s == null ? void 0 : s.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ut,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (s == null ? void 0 : s.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ut,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (s == null ? void 0 : s.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: zi
    };
  if (t === "binary_sensor") {
    if (Uo(e))
      return {
        entity_id: (s == null ? void 0 : s.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: zi
      };
    if (Ho(e))
      return {
        entity_id: (s == null ? void 0 : s.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ut,
        off_event: "none",
        off_trailing: 0
      };
    if (Wo(e))
      return {
        entity_id: (s == null ? void 0 : s.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ut,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (s == null ? void 0 : s.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: ut,
    off_event: "none",
    off_trailing: 0
  };
}
function We(s, t, e) {
  const i = yn(e == null ? void 0 : e.entity_id), n = wn(e);
  if (bn(i)) {
    const a = s.on_timeout && s.on_timeout > 0 ? s.on_timeout : ut;
    return {
      ...s,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const a = s.on_timeout ?? (n.mode === "any_change" ? n.on_timeout : ut);
    return {
      ...s,
      mode: t,
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  const o = n.mode === "specific_states" ? n : {
    ...n,
    on_event: "trigger",
    on_timeout: ut,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...s,
    mode: t,
    on_event: s.on_event ?? o.on_event,
    on_timeout: s.on_timeout ?? o.on_timeout,
    off_event: s.off_event ?? o.off_event,
    off_trailing: s.off_trailing ?? o.off_trailing
  };
}
const xn = "topomation_", Ue = "[topomation]", qo = "topomation/actions/rules/list", Ko = "topomation/actions/rules/create", Vo = "topomation/actions/rules/delete";
function Go(s) {
  if (!s || typeof s != "object") return;
  const t = s;
  if (typeof t.code == "string" && t.code.trim())
    return t.code.trim().toLowerCase();
  if (typeof t.error == "string" && t.error.trim())
    return t.error.trim().toLowerCase();
}
function hi(s) {
  const t = Go(s);
  if (t && ["unknown_command", "not_found", "invalid_format", "unknown_error"].includes(t))
    return !0;
  const e = kn(s).toLowerCase();
  return e.includes("unknown_command") || e.includes("unknown command") || e.includes("unsupported") || e.includes("not loaded") || e.includes("not_loaded") || e.includes("invalid handler");
}
function me(s) {
  return new Error(
    `Topomation managed-action backend is unavailable for ${s}. Reload Home Assistant to ensure this integration version is fully active.`
  );
}
function pi(s) {
  const t = String(s || "").trim().toLowerCase();
  return t === "occupied" ? "on_occupied" : t === "vacant" ? "on_vacant" : t === "on_occupied" || t === "on_vacant" || t === "on_dark" || t === "on_bright" ? t : null;
}
function Yo(s) {
  return s === "on_dark" ? "dark" : s === "on_bright" ? "bright" : "any";
}
function Ee(s, t, e) {
  const i = String(t || "").trim().toLowerCase();
  return i === "any" || i === "dark" || i === "bright" ? i : e ? "dark" : Yo(s);
}
function Xo(s) {
  if (typeof s != "string" || !s.includes(Ue))
    return null;
  const t = s.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(Ue)) continue;
    const i = e.slice(Ue.length).trim();
    if (!i) return null;
    try {
      const n = JSON.parse(i), o = pi(n == null ? void 0 : n.trigger_type);
      if (typeof (n == null ? void 0 : n.location_id) == "string" && o)
        return {
          version: Number(n.version) || 1,
          location_id: n.location_id,
          trigger_type: o,
          ambient_condition: Ee(
            o,
            n.ambient_condition,
            !!n.require_dark
          ),
          must_be_occupied: !!n.must_be_occupied,
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: typeof n.start_time == "string" && n.start_time.trim().length > 0 ? n.start_time.trim() : void 0,
          end_time: typeof n.end_time == "string" && n.end_time.trim().length > 0 ? n.end_time.trim() : void 0,
          require_dark: typeof n.require_dark == "boolean" ? n.require_dark : void 0
        };
    } catch {
      return null;
    }
  }
  return null;
}
function Qo(s) {
  var r, c;
  const t = (s == null ? void 0 : s.actions) ?? (s == null ? void 0 : s.action), e = Array.isArray(t) ? t[0] : t;
  if (!e || typeof e != "object")
    return {};
  const i = typeof e.action == "string" ? e.action : "", n = i.includes(".") ? i.split(".").slice(1).join(".") : i, o = (r = e == null ? void 0 : e.target) == null ? void 0 : r.entity_id;
  if (typeof o == "string")
    return {
      action_entity_id: o,
      action_service: n || void 0
    };
  if (Array.isArray(o) && typeof o[0] == "string")
    return {
      action_entity_id: o[0],
      action_service: n || void 0
    };
  const a = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
  return typeof a == "string" ? {
    action_entity_id: a,
    action_service: n || void 0
  } : {
    action_service: n || void 0
  };
}
function Fi(s) {
  const t = (s == null ? void 0 : s.conditions) ?? (s == null ? void 0 : s.condition), e = Array.isArray(t) ? [...t] : t ? [t] : [];
  for (; e.length > 0; ) {
    const i = e.pop();
    if (!i || typeof i != "object") continue;
    if (i.condition === "state" && i.entity_id === "sun.sun" && i.state === "below_horizon")
      return !0;
    const n = i.conditions;
    Array.isArray(n) && e.push(...n);
  }
  return !1;
}
async function Jo(s) {
  try {
    const t = await s.callWS({ type: "config/entity_registry/list" });
    return Array.isArray(t) ? {
      entries: t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation"),
      usedStateFallback: !1
    } : {
      entries: [],
      usedStateFallback: !1
    };
  } catch (t) {
    return console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", t), {
      entries: Object.keys(s.states || {}).filter((e) => e.startsWith("automation.")).map((e) => ({ entity_id: e })),
      usedStateFallback: !0
    };
  }
}
function Zo(s, t) {
  const e = typeof (t == null ? void 0 : t.id) == "string" ? t.id.trim() : "";
  if (e) return e;
  const i = typeof s.unique_id == "string" ? s.unique_id.trim() : "";
  if (i) return i;
}
function ta(s) {
  return !!((typeof s.unique_id == "string" ? s.unique_id.trim().toLowerCase() : "").startsWith(xn) || (Array.isArray(s.labels) ? s.labels : []).some(
    (n) => typeof n == "string" && n.toLowerCase().includes("topomation")
  ) || Object.values(s.categories || {}).some(
    (n) => typeof n == "string" && n.toLowerCase().includes("topomation")
  ));
}
function ea(s) {
  return Object.entries(s.states || {}).some(([t, e]) => {
    var n;
    if (!t.startsWith("automation.")) return !1;
    const i = (n = e == null ? void 0 : e.attributes) == null ? void 0 : n.id;
    return typeof i == "string" && i.trim().toLowerCase().startsWith(xn);
  });
}
function kn(s) {
  if (typeof s == "string" && s.trim()) return s.trim();
  if (s instanceof Error && s.message.trim()) return s.message.trim();
  if (s && typeof s == "object" && "message" in s) {
    const t = s.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function ia(s, t) {
  const i = (await Jo(s)).entries, n = i.filter(ta), o = n.length > 0 ? n : i, a = [], c = (await Promise.all(
    o.map(async (l) => {
      var p, f;
      if (l.entity_id)
        try {
          const h = await s.callWS({
            type: "automation/config",
            entity_id: l.entity_id
          }), g = h == null ? void 0 : h.config;
          if (!g || typeof g != "object")
            return;
          const m = Xo(g.description);
          if (!m || m.location_id !== t)
            return;
          const v = Zo(l, g), S = Qo(g), $ = (p = s.states) == null ? void 0 : p[l.entity_id], x = $ ? $.state !== "off" : !0, j = typeof g.alias == "string" && g.alias.trim() || ((f = $ == null ? void 0 : $.attributes) == null ? void 0 : f.friendly_name) || l.entity_id;
          return {
            id: v || l.entity_id,
            entity_id: l.entity_id,
            name: j,
            trigger_type: m.trigger_type,
            action_entity_id: S.action_entity_id,
            action_service: S.action_service,
            ambient_condition: Ee(
              m.trigger_type,
              m.ambient_condition,
              typeof m.require_dark == "boolean" ? m.require_dark : Fi(g)
            ),
            must_be_occupied: !!m.must_be_occupied,
            time_condition_enabled: !!m.time_condition_enabled,
            start_time: m.start_time,
            end_time: m.end_time,
            require_dark: typeof m.require_dark == "boolean" ? m.require_dark : Fi(g),
            enabled: x
          };
        } catch (h) {
          a.push({
            entity_id: l.entity_id,
            error: h
          }), console.debug("[ha-automation-rules] failed to read automation config", l.entity_id, h);
          return;
        }
    })
  )).filter((l) => !!l).sort((l, p) => l.name.localeCompare(p.name)), d = o.length > 0 && a.length === o.length, u = n.length > 0 || ea(s);
  if (c.length === 0 && d && u) {
    const l = a[0], p = l ? kn(l.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${p}`);
  }
  return c;
}
async function na(s, t, e) {
  try {
    const i = await s.callWS({
      type: qo,
      location_id: t,
      ...e ? { entry_id: e } : {}
    });
    if (Array.isArray(i == null ? void 0 : i.rules))
      return i.rules.map((n) => {
        const o = pi(n.trigger_type);
        if (!o) return null;
        const a = !!n.require_dark, r = Ee(
          o,
          n.ambient_condition,
          a
        );
        return {
          ...n,
          trigger_type: o,
          ambient_condition: r,
          must_be_occupied: !!n.must_be_occupied,
          time_condition_enabled: !!n.time_condition_enabled,
          start_time: typeof n.start_time == "string" && n.start_time.length > 0 ? n.start_time : void 0,
          end_time: typeof n.end_time == "string" && n.end_time.length > 0 ? n.end_time : void 0,
          require_dark: a || r === "dark"
        };
      }).filter((n) => !!n).sort((n, o) => n.name.localeCompare(o.name));
  } catch (i) {
    if (!hi(i))
      throw i;
  }
  return ia(s, t);
}
async function oa(s, t, e) {
  try {
    const i = await s.callWS({
      type: Ko,
      location_id: t.location.id,
      name: t.name,
      trigger_type: t.trigger_type,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service,
      ambient_condition: t.ambient_condition,
      must_be_occupied: !!t.must_be_occupied,
      time_condition_enabled: !!t.time_condition_enabled,
      start_time: t.start_time,
      end_time: t.end_time,
      require_dark: !!t.require_dark,
      ...e ? { entry_id: e } : {}
    });
    if (i != null && i.rule) {
      const n = pi(i.rule.trigger_type) || t.trigger_type, o = !!i.rule.require_dark, a = Ee(
        n,
        i.rule.ambient_condition,
        o
      );
      return {
        ...i.rule,
        trigger_type: n,
        ambient_condition: a,
        must_be_occupied: !!i.rule.must_be_occupied,
        time_condition_enabled: !!i.rule.time_condition_enabled,
        start_time: typeof i.rule.start_time == "string" && i.rule.start_time.length > 0 ? i.rule.start_time : void 0,
        end_time: typeof i.rule.end_time == "string" && i.rule.end_time.length > 0 ? i.rule.end_time : void 0,
        require_dark: o || a === "dark"
      };
    }
  } catch (i) {
    throw hi(i) ? me("rule creation") : i;
  }
  throw me("rule creation");
}
async function aa(s, t, e) {
  const i = typeof t == "string" ? t : t.id, n = typeof t == "string" ? void 0 : t.entity_id;
  try {
    const o = await s.callWS({
      type: Vo,
      automation_id: i,
      ...n ? { entity_id: n } : {},
      ...e ? { entry_id: e } : {}
    });
    if ((o == null ? void 0 : o.success) === !0)
      return;
  } catch (o) {
    throw hi(o) ? me("rule deletion") : o;
  }
  throw me("rule deletion");
}
var Hi, qi;
try {
  (qi = (Hi = import.meta) == null ? void 0 : Hi.hot) == null || qi.accept(() => window.location.reload());
} catch {
}
const ye = class ye extends gt {
  constructor() {
    super(...arguments), this.allLocations = [], this.adjacencyEdges = [], this.entityRegistryRevision = 0, this.occupancyStates = {}, this.occupancyTransitions = {}, this.handoffTraces = [], this._activeTab = "detection", this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._entityRegistryMetaById = {}, this._actionRules = [], this._actionRulesDraftDirty = !1, this._savingActionRules = !1, this._loadingActionRules = !1, this._liveOccupancyStateByLocation = {}, this._nowEpochMs = Date.now(), this._editingActionRuleNameValue = "", this._actionRuleTabById = {}, this._savingLinkedLocations = !1, this._showAdvancedAdjacency = !1, this._showRecentOccupancyEvents = !1, this._adjacencyNeighborId = "", this._adjacencyBoundaryType = "door", this._adjacencyDirection = "bidirectional", this._adjacencyCrossingSources = "", this._adjacencyHandoffWindowSec = 12, this._adjacencyPriority = 50, this._savingAdjacency = !1, this._wiabInteriorEntityId = "", this._wiabDoorEntityId = "", this._wiabExteriorDoorEntityId = "", this._wiabShowAllEntities = !1, this._loadingAmbientReading = !1, this._savingAmbientConfig = !1, this._savingDuskDawnConfig = !1, this._duskDawnDraftDirty = !1, this._editingLightingRuleNameValue = "", this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._ambientReadingLoadSeq = 0, this._sourcePersistInFlight = !1, this._sourcePersistQueued = !1, this._linkedPersistChain = Promise.resolve(), this._linkedPersistQueueDepth = 0;
  }
  render() {
    return this.location ? _`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()}
        ${this._renderContent()}
      </div>
    ` : _`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  willUpdate(t) {
    var e;
    if (t.has("hass") && (this._entityAreaById = {}, this._entityAreaLoadPromise = void 0, this._liveOccupancyStateByLocation = {}, this.hass && (this._loadEntityAreaAssignments(), this._loadActionRules(), this._subscribeAutomationStateChanged())), t.has("forcedTab")) {
      const i = this._mapRequestedTab(this.forcedTab);
      i ? this._activeTab = i : t.get("forcedTab") && (this._activeTab = "detection");
    }
    if (t.has("location")) {
      const i = t.get("location"), n = (i == null ? void 0 : i.id) || "", o = ((e = this.location) == null ? void 0 : e.id) || "";
      n !== o ? (this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._resetSourceDraftState(), this._stagedLinkedLocations = void 0, this._externalAreaId = "", this._externalEntityId = "", this._wiabShowAllEntities = !1, this._showAdvancedAdjacency = !1, this._showRecentOccupancyEvents = !1, this._onTimeoutMemory = {}, this._actionRulesDraft = void 0, this._actionRulesDraftDirty = !1, this._actionRulesSaveError = void 0, this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "", this._actionRuleTabById = {}, this._ambientReading = void 0, this._ambientReadingError = void 0, this._cancelLightingRuleNameEdit(), this._resetDuskDawnDraftFromLocation(), this.hass && this._loadEntityAreaAssignments(), this._loadAmbientReading()) : this._duskDawnDraftDirty || this._resetDuskDawnDraftFromLocation(), this._loadActionRules();
    }
    if (t.has("entryId")) {
      const i = t.get("entryId") || "", n = this.entryId || "";
      i !== n && (this._loadActionRules(), this._loadAmbientReading());
    }
    t.has("entityRegistryRevision") && this._loadEntityAreaAssignments();
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass)
      return this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0, !0;
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const n = await na(this.hass, e, this.entryId);
      return t !== this._actionRulesLoadSeq ? !1 : (this._actionRules = n, this._actionRulesDraftDirty || this._resetActionRulesDraftFromLoaded(), !0);
    } catch (n) {
      return t !== this._actionRulesLoadSeq || (this._actionRulesError = (n == null ? void 0 : n.message) || "Failed to load automation rules"), !1;
    } finally {
      t === this._actionRulesLoadSeq && (this._loadingActionRules = !1, this.requestUpdate());
    }
  }
  _ambientDefaults() {
    return {
      version: 1,
      lux_sensor: null,
      auto_discover: !1,
      inherit_from_parent: !0,
      dark_threshold: 50,
      bright_threshold: 500,
      fallback_to_sun: !0,
      assume_dark_on_error: !0
    };
  }
  _getAmbientConfig() {
    var i, n;
    const t = ((n = (i = this.location) == null ? void 0 : i.modules) == null ? void 0 : n.ambient) || {}, e = this._ambientDefaults();
    return {
      ...e,
      ...t,
      auto_discover: !1,
      dark_threshold: Number.isFinite(Number(t.dark_threshold)) ? Number(t.dark_threshold) : e.dark_threshold,
      bright_threshold: Number.isFinite(Number(t.bright_threshold)) ? Number(t.bright_threshold) : e.bright_threshold
    };
  }
  async _updateAmbientConfig(t) {
    this._savingAmbientConfig = !0;
    try {
      const e = {
        ...this._ambientDefaults(),
        ...t,
        auto_discover: !1,
        dark_threshold: Math.max(0, Number(t.dark_threshold) || 0),
        bright_threshold: Math.max(
          Math.max(1, Number(t.dark_threshold) || 0) + 1,
          Number(t.bright_threshold) || 0
        )
      };
      await this._updateModuleConfig("ambient", e), await this._loadAmbientReading(), this._showToast("Ambient settings updated", "success");
    } catch (e) {
      console.error("Failed to update ambient settings", e), this._showToast((e == null ? void 0 : e.message) || "Failed to update ambient settings", "error");
    } finally {
      this._savingAmbientConfig = !1;
    }
  }
  async _loadAmbientReading() {
    const t = ++this._ambientReadingLoadSeq;
    if (!this.location || !this.hass) {
      this._ambientReading = void 0, this._ambientReadingError = void 0, this._loadingAmbientReading = !1;
      return;
    }
    this._loadingAmbientReading = !0, this._ambientReadingError = void 0, this.requestUpdate();
    try {
      const e = this._getAmbientConfig(), i = await this.hass.callWS(
        this._withEntryId({
          type: "topomation/ambient/get_reading",
          location_id: this.location.id,
          dark_threshold: e.dark_threshold,
          bright_threshold: e.bright_threshold
        })
      );
      if (t !== this._ambientReadingLoadSeq) return;
      this._ambientReading = i, this._ambientReadingError = void 0;
    } catch (e) {
      if (t !== this._ambientReadingLoadSeq) return;
      this._ambientReading = void 0, this._ambientReadingError = (e == null ? void 0 : e.message) || "Failed to load ambient reading";
    } finally {
      t === this._ambientReadingLoadSeq && (this._loadingAmbientReading = !1, this.requestUpdate());
    }
  }
  _ambientSourceMethod(t) {
    if (!t) return "unknown";
    if (t.source_sensor) return t.is_inherited ? "inherited_sensor" : "sensor";
    const e = String(t.fallback_method || "").trim().toLowerCase();
    return e ? e.includes("sun") ? "sun_fallback" : e === "assume_dark" ? "assume_dark" : e === "assume_bright" ? "assume_bright" : e : "unknown";
  }
  _ambientSourceMethodLabel(t) {
    return t === "sensor" ? "Sensor" : t === "inherited_sensor" ? "Inherited sensor" : t === "sun_fallback" ? "Sun fallback" : t === "assume_dark" ? "Assume dark" : t === "assume_bright" ? "Assume bright" : "Unknown";
  }
  _formatAmbientLux(t) {
    const e = t == null ? void 0 : t.lux;
    return typeof e != "number" || Number.isNaN(e) ? "n/a" : `${e.toFixed(1)} lx`;
  }
  _ambientSensorCandidates() {
    var i, n, o;
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set(), e = this._getAmbientConfig();
    typeof e.lux_sensor == "string" && e.lux_sensor.trim() && t.add(e.lux_sensor.trim());
    for (const a of this.location.entity_ids || [])
      this._isLuxSensorEntity(a) && t.add(a);
    if (this.location.ha_area_id) {
      const a = ((i = this.hass) == null ? void 0 : i.states) || {};
      for (const r of Object.keys(a)) {
        const c = this._entityAreaById[r];
        (c !== void 0 ? c : (o = (n = a[r]) == null ? void 0 : n.attributes) == null ? void 0 : o.area_id) === this.location.ha_area_id && this._isLuxSensorEntity(r) && t.add(r);
      }
    }
    return [...t].sort((a, r) => this._entityName(a).localeCompare(this._entityName(r)));
  }
  _isLuxSensorEntity(t) {
    var i, n;
    const e = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t];
    return this._isLuxSensorEntityForState(t, e);
  }
  _isLuxSensorEntityForState(t, e) {
    if (!e || !t.startsWith("sensor.")) return !1;
    const i = e.attributes || {};
    if (String(i.device_class || "").toLowerCase() === "illuminance") return !0;
    const o = String(i.unit_of_measurement || "").toLowerCase();
    if (o === "lx" || o === "lux") return !0;
    const a = t.toLowerCase();
    return a.includes("lux") || a.includes("illuminance") || a.includes("light_level");
  }
  _duskDawnDefaults() {
    return {
      version: 3,
      blocks: []
    };
  }
  _normalizeDuskDawnTriggerMode(t) {
    return t === "on_occupied" ? "on_occupied" : t === "on_vacant" ? "on_vacant" : t === "on_dark" ? "on_dark" : t === "on_bright" ? "on_bright" : t === "while_dark_on_occupancy" ? "on_occupied" : "on_dark";
  }
  _defaultAmbientConditionForTrigger(t) {
    return "any";
  }
  _lockedAmbientConditionForTrigger(t) {
    if (t === "on_dark") return "dark";
    if (t === "on_bright") return "bright";
  }
  _isAmbientConditionLockedByTrigger(t) {
    return this._lockedAmbientConditionForTrigger(t) !== void 0;
  }
  _lockedMustBeOccupiedForTrigger(t) {
    if (t === "on_occupied") return !0;
    if (t === "on_vacant") return !1;
  }
  _isMustBeOccupiedLockedByTrigger(t) {
    return this._lockedMustBeOccupiedForTrigger(t) !== void 0;
  }
  _applyTriggerDerivedBlockConstraints(t) {
    const e = this._normalizeDuskDawnTriggerMode(t.trigger_mode), i = { ...t }, n = this._lockedAmbientConditionForTrigger(e);
    n !== void 0 && (i.ambient_condition = n);
    const o = this._lockedMustBeOccupiedForTrigger(e);
    return o !== void 0 && (i.must_be_occupied = o), i;
  }
  _normalizeDuskDawnAmbientCondition(t, e) {
    const i = this._lockedAmbientConditionForTrigger(e);
    return i !== void 0 ? i : t === "dark" ? "dark" : t === "bright" ? "bright" : t === "any" ? "any" : this._defaultAmbientConditionForTrigger(e);
  }
  _normalizeDuskDawnMustBeOccupied(t, e) {
    const i = this._normalizeDuskDawnTriggerMode(e), n = this._lockedMustBeOccupiedForTrigger(i);
    return n !== void 0 ? n : typeof t == "boolean" ? t : e === "at_dark_if_occupied";
  }
  _normalizeDuskDawnAlreadyOnBehavior(t) {
    return "set_target";
  }
  _timeToMinutes(t) {
    const i = String(t || "").trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (i)
      return Number(i[1]) * 60 + Number(i[2]);
  }
  _normalizeDuskDawnStartTime(t, e) {
    const i = typeof t == "string" ? t.trim() : "";
    return this._timeToMinutes(i) !== void 0 ? i : e;
  }
  _clampBrightnessPct(t, e = 30) {
    const i = Number(t);
    return Number.isFinite(i) ? Math.max(1, Math.min(100, Math.round(i))) : Math.max(1, Math.min(100, e));
  }
  _normalizeColorHex(t, e) {
    const i = typeof t == "string" ? t.trim() : "", n = i.startsWith("#") ? i : i ? `#${i}` : "";
    return /^#[0-9a-fA-F]{6}$/.test(n) ? n.toLowerCase() : e;
  }
  _normalizeDuskDawnBlockId(t, e) {
    return (typeof t == "string" ? t.trim() : "") || e;
  }
  _normalizeLegacyDuskDawnRuleName(t, e) {
    const i = typeof t == "string" ? t.trim() : "";
    if (!i) return `Rule ${e + 1}`;
    const n = i.match(/^block\s+(\d+)$/i);
    return n ? `Rule ${n[1]}` : i;
  }
  _sanitizeDuskDawnLightTargets(t) {
    const e = [], i = /* @__PURE__ */ new Set();
    if (Array.isArray(t))
      for (const n of t) {
        if (!n || typeof n != "object") continue;
        const o = n, a = typeof o.entity_id == "string" ? o.entity_id.trim() : "";
        if (!a || !a.startsWith("light.") || i.has(a)) continue;
        i.add(a);
        const r = o.power === "off" ? "off" : "on", c = {
          entity_id: a,
          power: r
        }, d = typeof o.already_on_behavior == "string" ? o.already_on_behavior.trim() : "";
        if (d && (c.already_on_behavior = this._normalizeDuskDawnAlreadyOnBehavior(d)), r === "on") {
          this._isDimmableEntity(a) && o.brightness_pct !== null && o.brightness_pct !== void 0 && (c.brightness_pct = this._clampBrightnessPct(o.brightness_pct, 30));
          const u = this._normalizeColorHex(o.color_hex);
          u && this._isColorCapableEntity(a) && (c.color_hex = u);
        }
        e.push(c);
      }
    return e;
  }
  _sanitizeDuskDawnBlock(t, e, i) {
    const n = t && typeof t == "object" ? t : {}, o = n.trigger_mode, a = this._normalizeDuskDawnTriggerMode(o), r = this._normalizeDuskDawnBlockId(n.id, e), c = this._normalizeLegacyDuskDawnRuleName(n.name, i), d = this._normalizeDuskDawnStartTime(n.start_time, "18:00"), u = this._normalizeDuskDawnStartTime(n.end_time, "23:59"), l = {
      id: r,
      name: c,
      start_time: d,
      end_time: u,
      time_condition_enabled: !!n.time_condition_enabled,
      trigger_mode: a,
      ambient_condition: this._normalizeDuskDawnAmbientCondition(n.ambient_condition, a),
      must_be_occupied: this._normalizeDuskDawnMustBeOccupied(n.must_be_occupied, o),
      already_on_behavior: this._normalizeDuskDawnAlreadyOnBehavior(n.already_on_behavior),
      light_targets: this._sanitizeDuskDawnLightTargets(n.light_targets)
    };
    return this._applyTriggerDerivedBlockConstraints(l);
  }
  _sanitizeDuskDawnBlocks(t) {
    if (!Array.isArray(t)) return [];
    const e = [], i = /* @__PURE__ */ new Set();
    for (let n = 0; n < t.length; n += 1) {
      const o = t[n];
      if (!o || typeof o != "object") continue;
      const a = o, r = this._normalizeDuskDawnBlockId(a.id, `rule_${n + 1}`);
      i.has(r) || (i.add(r), e.push(this._sanitizeDuskDawnBlock(a, r, e.length)));
    }
    return e;
  }
  _getDuskDawnConfig() {
    var i, n;
    const t = this._duskDawnDefaults(), e = ((n = (i = this.location) == null ? void 0 : i.modules) == null ? void 0 : n.dusk_dawn) || {};
    return Number(e.version) !== 3 ? t : {
      version: 3,
      blocks: this._sanitizeDuskDawnBlocks(e.blocks)
    };
  }
  _resetDuskDawnDraftFromLocation() {
    if (!this.location) {
      this._duskDawnDraft = void 0, this._duskDawnDraftDirty = !1, this._duskDawnSaveError = void 0, this._cancelLightingRuleNameEdit();
      return;
    }
    const t = this._getDuskDawnConfig();
    this._duskDawnDraft = {
      version: 3,
      blocks: this._sanitizeDuskDawnBlocks(t.blocks)
    }, this._duskDawnDraftDirty = !1, this._duskDawnSaveError = void 0, this._cancelLightingRuleNameEdit();
  }
  _workingDuskDawnConfig() {
    return this._duskDawnDraft || this._getDuskDawnConfig();
  }
  _setDuskDawnDraft(t) {
    this._duskDawnDraft = {
      version: 3,
      blocks: this._sanitizeDuskDawnBlocks(t.blocks)
    }, this._duskDawnDraftDirty = !0, this._duskDawnSaveError = void 0, this.requestUpdate();
  }
  _duskDawnBlocks(t) {
    return this._sanitizeDuskDawnBlocks(t.blocks).map((e, i) => ({
      id: String(e.id || `rule_${i + 1}`),
      name: this._normalizeLegacyDuskDawnRuleName(e.name, i),
      start_time: String(e.start_time || "18:00"),
      end_time: String(e.end_time || "23:59"),
      time_condition_enabled: !!e.time_condition_enabled,
      trigger_mode: this._normalizeDuskDawnTriggerMode(e.trigger_mode),
      ambient_condition: this._normalizeDuskDawnAmbientCondition(e.ambient_condition, this._normalizeDuskDawnTriggerMode(e.trigger_mode)),
      must_be_occupied: this._normalizeDuskDawnMustBeOccupied(e.must_be_occupied, e.trigger_mode),
      already_on_behavior: this._normalizeDuskDawnAlreadyOnBehavior(e.already_on_behavior),
      light_targets: this._sanitizeDuskDawnLightTargets(e.light_targets).map((n) => ({
        entity_id: String(n.entity_id || ""),
        power: n.power === "off" ? "off" : "on",
        brightness_pct: typeof n.brightness_pct == "number" ? this._clampBrightnessPct(n.brightness_pct, 30) : void 0,
        color_hex: this._normalizeColorHex(n.color_hex),
        already_on_behavior: typeof n.already_on_behavior == "string" && n.already_on_behavior.trim() ? this._normalizeDuskDawnAlreadyOnBehavior(n.already_on_behavior) : void 0
      }))
    }));
  }
  _duskDawnConfiguredActionCount(t) {
    return this._duskDawnBlocks(t).reduce((e, i) => e + i.light_targets.length, 0);
  }
  _duskDawnValidationErrors(t) {
    const e = [], i = this._duskDawnBlocks(t);
    for (const n of i) {
      String(n.name || "").trim() || e.push("Rule name is required."), this._timeToMinutes(n.start_time) === void 0 && e.push(`Invalid start time for ${n.name}.`), this._timeToMinutes(n.end_time) === void 0 && e.push(`Invalid end time for ${n.name}.`);
      for (const o of n.light_targets)
        if (!o.entity_id || !o.entity_id.startsWith("light.")) {
          e.push(`Invalid light target in ${n.name}.`);
          break;
        }
    }
    return e;
  }
  async _updateDuskDawnConfig(t) {
    if (!this.location) return !1;
    this._savingDuskDawnConfig = !0;
    try {
      const e = {
        version: 3,
        blocks: this._sanitizeDuskDawnBlocks(t.blocks)
      };
      return await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: "dusk_dawn",
          config: e
        })
      ), this.location.modules.dusk_dawn = e, this.requestUpdate(), this._showToast("Lighting settings updated", "success"), !0;
    } catch (e) {
      return console.error("Failed to update lighting settings", e), this._showToast((e == null ? void 0 : e.message) || "Failed to update lighting settings", "error"), !1;
    } finally {
      this._savingDuskDawnConfig = !1;
    }
  }
  _duskDawnTargetEntities() {
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set();
    for (const e of this.location.entity_ids || [])
      e.startsWith("light.") && t.add(e);
    if (this.location.ha_area_id)
      for (const e of this._entitiesForArea(this.location.ha_area_id))
        e.startsWith("light.") && t.add(e);
    return [...t].sort((e, i) => this._entityName(e).localeCompare(this._entityName(i)));
  }
  _defaultDuskDawnLightTarget(t) {
    const e = t || this._duskDawnTargetEntities()[0] || "", i = {
      entity_id: e,
      power: "on",
      already_on_behavior: "set_target"
    };
    return e && this._isDimmableEntity(e) && (i.brightness_pct = 30), e && this._isColorCapableEntity(e) && (i.color_hex = "#ffffff"), i;
  }
  _updateDuskDawnBlockLightTargets(t, e, i) {
    const n = this._sanitizeDuskDawnBlocks(t.blocks).map(
      (o) => o.id === e ? {
        ...o,
        light_targets: i
      } : o
    );
    this._setDuskDawnDraft({
      ...t,
      blocks: n
    });
  }
  _addDuskDawnBlock(t) {
    const e = this._sanitizeDuskDawnBlocks(t.blocks), i = e.length + 1;
    e.push({
      id: `rule_${Date.now()}_${i}`,
      name: `Rule ${i}`,
      start_time: "18:00",
      end_time: "23:59",
      time_condition_enabled: !1,
      trigger_mode: "on_dark",
      ambient_condition: "any",
      must_be_occupied: !1,
      already_on_behavior: "set_target",
      light_targets: []
    }), this._setDuskDawnDraft({
      ...t,
      blocks: e
    });
  }
  _removeDuskDawnBlock(t, e) {
    const i = this._sanitizeDuskDawnBlocks(t.blocks).filter((n) => n.id !== e);
    this._setDuskDawnDraft({
      ...t,
      blocks: i
    });
  }
  _updateDuskDawnBlock(t, e, i) {
    const n = this._sanitizeDuskDawnBlocks(t.blocks).map((o) => {
      if (o.id !== e) return o;
      const a = { ...o, ...i };
      return this._applyTriggerDerivedBlockConstraints(a);
    });
    this._setDuskDawnDraft({
      ...t,
      blocks: n
    });
  }
  _startLightingRuleNameEdit(t, e) {
    this._editingLightingRuleNameId = t, this._editingLightingRuleNameValue = e, this.requestUpdate();
  }
  _cancelLightingRuleNameEdit() {
    this._editingLightingRuleNameId = void 0, this._editingLightingRuleNameValue = "", this.requestUpdate();
  }
  _commitLightingRuleNameEdit(t, e, i) {
    if (this._editingLightingRuleNameId !== e) return;
    const n = this._editingLightingRuleNameValue.trim() || i;
    this._updateDuskDawnBlock(t, e, { name: n }), this._cancelLightingRuleNameEdit();
  }
  async _saveDuskDawnDraft() {
    const t = this._workingDuskDawnConfig();
    await this._updateDuskDawnConfig(t) ? this._resetDuskDawnDraftFromLocation() : this._duskDawnSaveError = "Save failed. Review values and try again.";
  }
  _resetDuskDawnDraft() {
    this._resetDuskDawnDraftFromLocation(), this._showToast("Lighting changes reverted", "success");
  }
  async _loadEntityAreaAssignments() {
    var t;
    this._entityAreaLoadPromise || !((t = this.hass) != null && t.callWS) || (this._entityAreaLoadPromise = (async () => {
      try {
        const [e, i] = await Promise.all([
          this.hass.callWS({ type: "config/entity_registry/list" }),
          this.hass.callWS({ type: "config/device_registry/list" })
        ]), n = /* @__PURE__ */ new Map();
        if (Array.isArray(i))
          for (const r of i) {
            const c = typeof (r == null ? void 0 : r.id) == "string" ? r.id : void 0, d = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0;
            c && d && n.set(c, d);
          }
        const o = {}, a = {};
        if (Array.isArray(e))
          for (const r of e) {
            const c = typeof (r == null ? void 0 : r.entity_id) == "string" ? r.entity_id : void 0;
            if (!c) continue;
            const d = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0, u = typeof (r == null ? void 0 : r.device_id) == "string" ? n.get(r.device_id) : void 0;
            o[c] = d || u || null, a[c] = {
              hiddenBy: typeof (r == null ? void 0 : r.hidden_by) == "string" ? r.hidden_by : null,
              disabledBy: typeof (r == null ? void 0 : r.disabled_by) == "string" ? r.disabled_by : null,
              entityCategory: typeof (r == null ? void 0 : r.entity_category) == "string" ? r.entity_category : null
            };
          }
        this._entityAreaById = o, this._entityRegistryMetaById = a;
      } catch {
        this._entityAreaById = {}, this._entityRegistryMetaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, n = this._getLockState(), o = this._getOccupancyState(), a = this._resolveOccupiedState(o), r = a === !0, c = a === !0 ? "Occupied" : a === !1 ? "Vacant" : "Unknown", d = this._resolveVacancyReason(o, a), u = this._resolveOccupiedReason(o, a), l = r ? u : d, p = o ? this._resolveVacantAt(o.attributes || {}, r) : void 0, f = r ? this._formatVacantAtLabel(p) : void 0, g = this._ambientSourceMethod(this._ambientReading) === "inherited_sensor" ? " (inherited)" : "", m = this._loadingAmbientReading ? "Ambient: loading..." : this._ambientReadingError ? "Ambient: unavailable" : `Ambient: ${this._formatAmbientLux(this._ambientReading)}${g}`;
    return _`
      <div class="header">
        <div class="header-main">
          <div class="header-icon">
            <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
          </div>
          <div class="header-content">
            <div class="location-name">${this.location.name}</div>
            <div class="header-status">
              <span
                class="status-chip ${r ? "occupied" : "vacant"}"
                data-testid="header-occupancy-status"
                .title=${l || ""}
              >
                ${c}
              </span>
              <span
                class="status-chip ${n.isLocked ? "locked" : ""}"
                data-testid="header-lock-status"
              >
                ${n.isLocked ? "Locked" : "Unlocked"}
              </span>
              <span class="header-ambient" data-testid="header-ambient-lux">
                ${m}
              </span>
              ${r ? _`
                    <span class="header-vacant-at" data-testid="header-vacant-at">
                      Vacant at ${f}
                    </span>
                  ` : ""}
            </div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-row">
            <span class="meta-label">${e}</span>
            <span class="meta-value">${i}</span>
          </div>
        </div>
      </div>
    `;
  }
  _headerIcon(t) {
    var i, n, o;
    const e = t.ha_area_id;
    return e && ((o = (n = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : n[e]) != null && o.icon) ? this.hass.areas[e].icon : vn(t);
  }
  _renderTabs() {
    return _`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "detection", this.requestUpdate();
    }}
        >
          Detection
        </button>
        <button
          class="tab ${this._activeTab === "ambient" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "ambient", this.requestUpdate();
    }}
        >
          Ambient
        </button>
        <button
          class="tab ${this._activeTab === "lighting" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "lighting", this.requestUpdate();
    }}
        >
          Lighting
        </button>
        <button
          class="tab ${this._activeTab === "appliances" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "appliances", this.requestUpdate();
    }}
        >
          Appliances
        </button>
        <button
          class="tab ${this._activeTab === "media" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "media", this.requestUpdate();
    }}
        >
          Media
        </button>
        <button
          class="tab ${this._activeTab === "hvac" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "hvac", this.requestUpdate();
    }}
        >
          HVAC
        </button>
      </div>
    `;
  }
  _renderContent() {
    const t = this._effectiveTab();
    return _`
      <div class="tab-content">
        ${t === "detection" ? _`${this._renderOccupancyTab()} ${this._renderAdvancedTab()}` : t === "ambient" ? this._renderAmbientTab() : t === "lighting" ? this._renderDuskDawnTab() : t === "appliances" ? this._renderDeviceAutomationTab("appliances") : t === "media" ? this._renderDeviceAutomationTab("media") : t === "hvac" ? this._renderDeviceAutomationTab("hvac") : ""}
      </div>
    `;
  }
  _effectiveTab() {
    return this._activeTab;
  }
  _mapRequestedTab(t) {
    if (t === "detection") return "detection";
    if (t === "ambient") return "ambient";
    if (t === "lighting") return "lighting";
    if (t === "appliances") return "appliances";
    if (t === "media") return "media";
    if (t === "hvac") return "hvac";
    if (t === "dusk_dawn") return "lighting";
    if (t === "occupancy") return "detection";
  }
  connectedCallback() {
    super.connectedCallback(), this._startClockTicker(), this._subscribeAutomationStateChanged();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._stopClockTicker(), this._resetSourceDraftState(), this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0);
  }
  _scheduleActionRulesReload(t = 250) {
    this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._actionRulesReloadTimer = window.setTimeout(() => {
      this._actionRulesReloadTimer = void 0, this._loadActionRules();
    }, t);
  }
  _scheduleAmbientReadingReload(t = 300) {
    !this.location || !this.hass || (this._ambientReadingReloadTimer && (window.clearTimeout(this._ambientReadingReloadTimer), this._ambientReadingReloadTimer = void 0), this._ambientReadingReloadTimer = window.setTimeout(() => {
      this._ambientReadingReloadTimer = void 0, this._loadAmbientReading();
    }, t));
  }
  async _subscribeAutomationStateChanged() {
    var t, e;
    if (this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), !!((e = (t = this.hass) == null ? void 0 : t.connection) != null && e.subscribeEvents))
      try {
        this._unsubAutomationStateChanged = await this.hass.connection.subscribeEvents(
          (i) => {
            var d, u, l, p;
            const n = (d = i == null ? void 0 : i.data) == null ? void 0 : d.entity_id, o = (u = i == null ? void 0 : i.data) == null ? void 0 : u.new_state, a = (l = i == null ? void 0 : i.data) == null ? void 0 : l.old_state, r = (o == null ? void 0 : o.attributes) || {}, c = (a == null ? void 0 : a.attributes) || {};
            if (typeof n == "string" && n.startsWith("binary_sensor.")) {
              const f = typeof r.location_id == "string" ? r.location_id : void 0, h = typeof c.location_id == "string" ? c.location_id : void 0, g = f || h, m = r.device_class === "occupancy", v = c.device_class === "occupancy";
              if (g && (m || v)) {
                if (o && m)
                  this._liveOccupancyStateByLocation = {
                    ...this._liveOccupancyStateByLocation,
                    [g]: o
                  };
                else {
                  const { [g]: S, ...$ } = this._liveOccupancyStateByLocation;
                  this._liveOccupancyStateByLocation = $;
                }
                ((p = this.location) == null ? void 0 : p.id) === g && this.requestUpdate();
              }
            }
            typeof n == "string" && this._isAmbientStateChangeRelevant(n, o, a) && this._scheduleAmbientReadingReload(), !(typeof n != "string" || !n.startsWith("automation.")) && this._scheduleActionRulesReload();
          },
          "state_changed"
        );
      } catch {
      }
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const t = this.location.modules.occupancy || {}, e = this._isFloorLocation(), i = !!this.location.ha_area_id, n = this._isSiblingAreaSourceScope(), o = (t.occupancy_sources || []).length, a = this._getLockState(), r = this._occupancyContributions(t), c = this._showRecentOccupancyEvents ? r : r.slice(0, 1);
    return e ? _`
        <div>
          <div class="card-section">
            <div class="section-title">
              <ha-icon .icon=${"mdi:layers"}></ha-icon>
              Floor Occupancy Behavior
            </div>
            <div class="policy-note">
              Floors do not use direct occupancy sources. Floor occupancy is derived from child areas, so
              add sensors to those areas and use this floor for aggregated automation.
            </div>
            ${o > 0 ? _`
                  <div class="policy-warning">
                    This floor still has ${o} unsupported source${o === 1 ? "" : "s"} in
                    config. Floor sources are unsupported and should be moved to areas.
                  </div>
                ` : ""}
          </div>
        </div>
      ` : _`
      <div>
        <div class="card-section">
          ${a.isLocked ? _`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${a.lockedBy.length ? _`Held by ${a.lockedBy.join(", ")}.` : _`Occupancy is currently held by a lock.`}
              </div>
              ${a.lockModes.length ? _`
                    <div class="runtime-note">
                      Modes: ${a.lockModes.map((d) => this._lockModeLabel(d)).join(", ")}
                    </div>
                  ` : ""}
              ${a.directLocks.length ? _`
                    <div class="lock-directive-list">
                      ${a.directLocks.map((d) => _`
                        <div class="lock-directive">
                          <span class="lock-pill">${d.sourceId}</span>
                          <span>${this._lockModeLabel(d.mode)}</span>
                          <span>${this._lockScopeLabel(d.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : _`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="sources-heading">
            <div class="section-title">Sources</div>
            <div class="sources-inline-help">
              ${i ? "Select sensors in this area." : "Integration-owned location: choose sources from Home Assistant entities."}
            </div>
          </div>
          ${r.length > 0 ? _`
                <div class="card-section">
                  <div class="section-title">
                    <ha-icon .icon=${"mdi:clock-outline"}></ha-icon>
                    Recent Occupancy Events
                  </div>
                  <div class="sources-inline-help" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
                    Sources currently contributing to occupancy.
                    ${r.length > 1 ? _`
                          <button
                            class="button button-secondary"
                            type="button"
                            style="padding: 2px 8px; font-size: 11px;"
                            data-testid="recent-events-toggle"
                            @click=${() => {
      this._showRecentOccupancyEvents = !this._showRecentOccupancyEvents, this.requestUpdate();
    }}
                          >
                            ${this._showRecentOccupancyEvents ? "Show less" : "Show all"}
                          </button>
                        ` : ""}
                  </div>
                  <div class="occupancy-events">
                    ${c.map(
      (d) => _`
                        <div class="occupancy-event">
                          <span class="occupancy-event-source">${d.sourceLabel}</span>
                          <span class="occupancy-event-meta">${d.stateLabel}</span>
                          ${d.relativeTime ? _`<span class="occupancy-event-meta">${d.relativeTime}</span>` : ""}
                        </div>
                      `
    )}
                  </div>
                </div>
              ` : ""}
          ${i ? "" : _`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="external-source-section">
            <div class="subsection-title">Add Source</div>
            <div class="subsection-help">
              ${i ? n ? "Need more coverage? Add a source from a sibling area or include all compatible entities from this area." : "Need more coverage? Add a source from another area or include all compatible entities from this area." : "Add a source from any HA area (including unassigned entities)."}
            </div>
            ${this._renderExternalSourceComposer(t)}
          </div>
        </div>
        ${this._renderSyncLocationsSection(t)}
      </div>
    `;
  }
  _renderAmbientTab() {
    return this.location ? _`<div>${this._renderAmbientSection()}</div>` : "";
  }
  _renderAdvancedTab() {
    if (!this.location) return "";
    const t = this.location.modules.occupancy || {};
    return _`
      <div>
        ${this._renderSyncLocationsSection(t)}
        ${this._renderWiabSection(t)}
        ${this._renderAdjacencyAdvancedSection(t)}
        ${this._isManagedShadowHost() ? this._renderManagedShadowAreaSection() : ""}
      </div>
    `;
  }
  _renderDuskDawnTab() {
    if (!this.location) return "";
    const t = this._workingDuskDawnConfig(), e = this._duskDawnValidationErrors(t), i = this._savingDuskDawnConfig, n = this._duskDawnDraftDirty;
    return _`
      ${this._renderActionStartupConfig("lighting")}
      <div class="card-section" data-testid="duskdawn-policy-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${"mdi:tune-variant"}></ha-icon>
            Lighting rules
          </div>
          <div class="section-title-actions">
            <button
              class="dusk-save-button ${n ? "dirty" : ""}"
              type="button"
              data-testid="lighting-rules-save"
              ?disabled=${i || !n}
              @click=${() => this._saveDuskDawnDraft()}
            >
              Save changes
            </button>
          </div>
        </div>
        ${this._duskDawnSaveError ? _`<div class="policy-warning" data-testid="lighting-rules-save-error">${this._duskDawnSaveError}</div>` : ""}
        ${e.map(
      (o) => _`<div class="policy-warning" data-testid="duskdawn-validation">${o}</div>`
    )}
        ${this._renderDuskDawnBlocks(t, i)}
      </div>
    `;
  }
  _renderDuskDawnBlockLightActions(t, e, i, n, o) {
    const a = this._duskDawnTargetEntities(), r = this._sanitizeDuskDawnLightTargets(t), c = r.map((l) => String(l.entity_id || "").trim()).filter(Boolean), d = [...a, ...c.filter((l) => !a.includes(l))], u = new Map(r.map((l) => [String(l.entity_id || "").trim(), l]));
    return _`
      <div class="dusk-light-actions" data-testid=${`${o}-actions`}>
        ${d.length === 0 ? _`<div class="text-muted">No local lights found for this location.</div>` : ""}
        ${d.map((l, p) => {
      const f = u.get(l), h = !!f, g = (f == null ? void 0 : f.power) === "off" ? "off" : "on", m = l ? this._isDimmableEntity(l) : !1, v = l ? this._isColorCapableEntity(l) : !1, S = this._clampBrightnessPct(f == null ? void 0 : f.brightness_pct, 30), $ = g === "off" ? 0 : S, x = this._normalizeColorHex(f == null ? void 0 : f.color_hex, "#ffffff") || "#ffffff", j = this._normalizeDuskDawnAlreadyOnBehavior(
        (f == null ? void 0 : f.already_on_behavior) || e
      ), N = m, q = j === "leave_unchanged", R = (L) => {
        const C = r.map((nt) => ({ ...nt })), G = C.findIndex((nt) => nt.entity_id === l), B = {
          ...G >= 0 ? { ...C[G] } : this._defaultDuskDawnLightTarget(l),
          ...L,
          entity_id: l
        };
        B.power === "off" ? (delete B.brightness_pct, delete B.color_hex) : (m ? B.brightness_pct = this._clampBrightnessPct(B.brightness_pct, 30) : delete B.brightness_pct, v ? B.color_hex = this._normalizeColorHex(B.color_hex, "#ffffff") || "#ffffff" : delete B.color_hex), G >= 0 ? C[G] = B : C.push(B), n(C);
      }, O = () => {
        n(r.filter((L) => L.entity_id !== l));
      };
      return _`
            <div class="dusk-light-action-row" data-testid=${`${o}-row-${p}`}>
              <div class="dusk-light-action-grid ${h ? "" : "disabled"}">
                <input
                  type="checkbox"
                  class="switch-input"
                  .checked=${h}
                  ?disabled=${i}
                  data-testid=${`${o}-include-${p}`}
                  @change=${(L) => {
        L.target.checked ? R({
          power: "on",
          already_on_behavior: N ? e : "set_target"
        }) : O();
      }}
                />
                <div class="dusk-light-entity-meta">
                  <span>${this._entityName(l)}</span>
                  <code>${l}</code>
                </div>
                ${m ? _`
                      <label class="dusk-level-control">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          class="dusk-level-slider"
                          .value=${String($)}
                          ?disabled=${i || !h}
                          data-testid=${`${o}-level-${p}`}
                          @input=${(L) => {
        const C = Number(L.target.value), G = Number.isFinite(C) ? Math.max(0, Math.min(100, Math.round(C))) : 0;
        G <= 0 ? R({ power: "off" }) : R({ power: "on", brightness_pct: G });
      }}
                        />
                        <span class="dusk-level-value">${$}%</span>
                      </label>
                    ` : _`
                      <select
                        .value=${g}
                        ?disabled=${i || !h}
                        data-testid=${`${o}-power-${p}`}
                        @change=${(L) => {
        const C = L.target.value === "off" ? "off" : "on";
        R({ power: C });
      }}
                      >
                        <option value="on">On</option>
                        <option value="off">Off</option>
                      </select>
                    `}
                ${h && g === "on" && v ? _`
                      <input
                        type="color"
                        class="input"
                        .value=${x}
                        ?disabled=${i}
                        data-testid=${`${o}-color-${p}`}
                        @change=${(L) => {
        R({
          color_hex: this._normalizeColorHex(L.target.value, "#ffffff") || "#ffffff"
        });
      }}
                      />
                    ` : _`<span class="text-muted">-</span>`}
                ${N ? _`
                      <label class="dusk-off-only-toggle">
                        <input
                          type="checkbox"
                          .checked=${q}
                          ?disabled=${i || !h}
                          data-testid=${`${o}-already-on-${p}`}
                          @change=${(L) => {
        R({
          already_on_behavior: L.target.checked ? "leave_unchanged" : "set_target"
        });
      }}
                        />
                        <span>Only if off</span>
                      </label>
                    ` : _`<span class="text-muted">-</span>`}
              </div>
            </div>
          `;
    })}
      </div>
    `;
  }
  _renderDuskDawnBlocks(t, e) {
    const i = this._duskDawnBlocks(t);
    return _`
      <div data-testid="duskdawn-schedule">
        <div class="dusk-block-list">
          ${i.length === 0 ? _`<div class="text-muted">No lighting rules configured yet.</div>` : i.map((n, o) => {
      var m;
      const a = ((m = n.name) == null ? void 0 : m.trim()) || `Rule ${o + 1}`, r = String(n.id || ""), c = this._editingLightingRuleNameId === r, d = this._normalizeDuskDawnTriggerMode(n.trigger_mode), u = this._isAmbientConditionLockedByTrigger(d), l = this._normalizeDuskDawnAmbientCondition(
        n.ambient_condition,
        d
      ), p = this._isMustBeOccupiedLockedByTrigger(d), f = this._normalizeDuskDawnMustBeOccupied(
        n.must_be_occupied,
        d
      ), h = l === "dark" ? "Must be dark" : l === "bright" ? "Must be bright" : "Ignore ambient", g = f ? "Must be occupied" : "Must be vacant";
      return _`
                  <div class="dusk-block-row" data-testid=${`duskdawn-block-${r}`}>
                    <div class="dusk-block-head">
                      ${c ? _`
                            <input
                              type="text"
                              class="input dusk-block-title-input"
                              .value=${this._editingLightingRuleNameValue}
                              ?disabled=${e}
                              data-testid=${`duskdawn-block-${r}-name`}
                              @input=${(v) => {
        this._editingLightingRuleNameValue = v.target.value, this.requestUpdate();
      }}
                              @blur=${() => this._commitLightingRuleNameEdit(t, r, `Rule ${o + 1}`)}
                              @keydown=${(v) => {
        v.key === "Enter" ? this._commitLightingRuleNameEdit(t, r, `Rule ${o + 1}`) : v.key === "Escape" && this._cancelLightingRuleNameEdit();
      }}
                            />
                          ` : _`
                            <button
                              type="button"
                              class="dusk-block-title-button"
                              ?disabled=${e}
                              data-testid=${`duskdawn-block-${r}-name`}
                              @click=${() => this._startLightingRuleNameEdit(r, a)}
                            >
                              ${a}
                            </button>
                          `}
                    </div>
                    <div class="dusk-rule-row">
                      <span class="config-label">Trigger</span>
                      <select
                        class="dusk-wide-select"
                        .value=${d}
                        ?disabled=${e}
                        data-testid=${`duskdawn-block-${r}-trigger`}
                        @change=${(v) => {
        const S = String(v.target.value);
        this._updateDuskDawnBlock(t, r, {
          trigger_mode: S
        });
      }}
                      >
                        <option value="on_occupied">On occupied</option>
                        <option value="on_vacant">On vacant</option>
                        <option value="on_dark">On dark</option>
                        <option value="on_bright">On bright</option>
                      </select>
                    </div>
                    <div class="dusk-rule-section-title dusk-section-heading">Conditions</div>
                    <div class="dusk-conditions">
                    <div class="config-row">
                      <div>
                        <div class="config-label">Ambient must be</div>
                        <div class="config-help">
                          ${u ? "Derived from trigger." : "Optional ambient filter at trigger time."}
                        </div>
                      </div>
                      <div class="config-value">
                        ${u ? _`
                              <div
                                class="dusk-condition-derived"
                                data-testid=${`duskdawn-block-${r}-ambient-locked`}
                              >
                                <span>${h}</span>
                                <span class="dusk-condition-derived-note">Set by trigger</span>
                              </div>
                            ` : _`
                              <select
                                class="dusk-wide-select"
                                .value=${l}
                                ?disabled=${e}
                                data-testid=${`duskdawn-block-${r}-ambient-condition`}
                                @change=${(v) => this._updateDuskDawnBlock(t, r, {
        ambient_condition: this._normalizeDuskDawnAmbientCondition(
          v.target.value,
          d
        )
      })}
                              >
                                <option value="any">Ignore ambient</option>
                                <option value="dark">Must be dark</option>
                                <option value="bright">Must be bright</option>
                              </select>
                            `}
                      </div>
                    </div>
                    <div class="config-row">
                      <div>
                        <div class="config-label">Must be occupied</div>
                        <div class="config-help">
                          ${p ? "Derived from trigger." : "Apply this rule only when the location is occupied at trigger time."}
                        </div>
                      </div>
                      <div class="config-value">
                        ${p ? _`
                              <div
                                class="dusk-condition-derived"
                                data-testid=${`duskdawn-block-${r}-must-be-occupied-locked`}
                              >
                                <span>${g}</span>
                                <span class="dusk-condition-derived-note">Set by trigger</span>
                              </div>
                            ` : _`
                              <input
                                type="checkbox"
                                class="switch-input"
                                .checked=${!!f}
                                ?disabled=${e}
                                data-testid=${`duskdawn-block-${r}-must-be-occupied`}
                                @change=${(v) => this._updateDuskDawnBlock(t, r, {
        must_be_occupied: v.target.checked
      })}
                              />
                            `}
                      </div>
                    </div>
                    <div class="config-row">
                      <div>
                        <div class="config-label">Use time window</div>
                        <div class="config-help">
                          Limit this rule to a time range. Crossing midnight is supported.
                        </div>
                      </div>
                      <div class="config-value">
                        <div class="dusk-time-inline">
                          <input
                            type="checkbox"
                            class="switch-input"
                            .checked=${!!n.time_condition_enabled}
                            ?disabled=${e}
                            data-testid=${`duskdawn-block-${r}-time-window`}
                            @change=${(v) => this._updateDuskDawnBlock(t, r, {
        time_condition_enabled: v.target.checked
      })}
                          />
                          ${n.time_condition_enabled ? _`
                                <div class="dusk-time-inline-fields">
                                  <label class="dusk-time-field">
                                    <span class="config-label">Begin</span>
                                    <input
                                      type="time"
                                      class="input dusk-time-input"
                                      step="60"
                                      .value=${String(n.start_time || "18:00")}
                                      ?disabled=${e}
                                      data-testid=${`duskdawn-block-${r}-start-time`}
                                      @change=${(v) => this._updateDuskDawnBlock(t, r, {
        start_time: this._normalizeDuskDawnStartTime(
          v.target.value,
          String(n.start_time || "18:00")
        )
      })}
                                    />
                                  </label>
                                  <label class="dusk-time-field">
                                    <span class="config-label">End</span>
                                    <input
                                      type="time"
                                      class="input dusk-time-input"
                                      step="60"
                                      .value=${String(n.end_time || "23:59")}
                                      ?disabled=${e}
                                      data-testid=${`duskdawn-block-${r}-end-time`}
                                      @change=${(v) => this._updateDuskDawnBlock(t, r, {
        end_time: this._normalizeDuskDawnStartTime(
          v.target.value,
          String(n.end_time || "23:59")
        )
      })}
                                    />
                                  </label>
                                </div>
                              ` : ""}
                        </div>
                      </div>
                    </div>
                    </div>
                    <div class="dusk-rule-section-title dusk-section-heading">Actions</div>
                    ${this._renderDuskDawnBlockLightActions(
        n.light_targets,
        n.already_on_behavior,
        e,
        (v) => this._updateDuskDawnBlockLightTargets(t, r, v),
        `duskdawn-block-${r}`
      )}
                    <div class="dusk-block-footer">
                      <button
                        class="button button-primary dusk-delete-rule-button"
                        type="button"
                        data-testid=${`duskdawn-block-${r}-delete`}
                        ?disabled=${e}
                        @click=${() => this._removeDuskDawnBlock(t, r)}
                      >
                        Delete rule
                      </button>
                    </div>
                  </div>
                `;
    })}
        </div>
        <div class="dusk-list-footer">
          <button
            class="button button-primary"
            type="button"
            data-testid="duskdawn-block-add-bottom"
            ?disabled=${e}
            @click=${() => this._addDuskDawnBlock(t)}
          >
            Add rule
          </button>
        </div>
      </div>
    `;
  }
  _isAmbientStateChangeRelevant(t, e, i) {
    var u, l, p, f, h;
    if (!this.location) return !1;
    const n = this._getAmbientConfig(), o = String(((u = this._ambientReading) == null ? void 0 : u.source_sensor) || "").trim(), a = String(n.lux_sensor || "").trim(), r = String(((l = this._ambientReading) == null ? void 0 : l.fallback_method) || "").toLowerCase(), c = !!n.fallback_to_sun || r.includes("sun");
    if (t === "sun.sun" && c) return !0;
    if (!t.startsWith("sensor.")) return !1;
    const d = e || i || ((f = (p = this.hass) == null ? void 0 : p.states) == null ? void 0 : f[t]);
    if (!this._isLuxSensorEntityForState(t, d)) return !1;
    if (t === o || t === a || (this.location.entity_ids || []).includes(t)) return !0;
    if (this.location.ha_area_id) {
      const g = this._entityAreaById[t], m = (h = d == null ? void 0 : d.attributes) == null ? void 0 : h.area_id;
      if ((g !== void 0 ? g : typeof m == "string" ? m : null) === this.location.ha_area_id) return !0;
    }
    return !1;
  }
  _renderAmbientSection() {
    if (!this.location) return "";
    const t = this._getAmbientConfig(), e = this._ambientReading, i = this._ambientSensorCandidates(), n = this._ambientSourceMethod(e), o = this._ambientSourceMethodLabel(n), a = (e == null ? void 0 : e.source_sensor) || "-", r = typeof (e == null ? void 0 : e.source_location) == "string" && e.source_location ? this._locationName(e.source_location) : "-", c = typeof (e == null ? void 0 : e.is_dark) == "boolean" ? e.is_dark ? "Yes" : "No" : "-", d = typeof (e == null ? void 0 : e.is_bright) == "boolean" ? e.is_bright ? "Yes" : "No" : "-", u = Math.max(0, Number(t.dark_threshold) || 0), l = Math.max(u + 1, Number(t.bright_threshold) || u + 1), p = typeof t.lux_sensor == "string" && t.lux_sensor.trim() ? t.lux_sensor.trim() : "", f = this._savingAmbientConfig;
    return _`
      <div class="card-section" data-testid="ambient-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:weather-sunny"}></ha-icon>
          Ambient
        </div>

        ${this._ambientReadingError ? _`
              <div class="policy-warning" data-testid="ambient-error">${this._ambientReadingError}</div>
            ` : ""}

        <div class="ambient-grid">
          <div class="ambient-key">Lux level</div>
          <div class="ambient-value" data-testid="ambient-lux-level">${this._formatAmbientLux(e)}</div>
          <div class="ambient-key">Is dark</div>
          <div class="ambient-value" data-testid="ambient-is-dark">${c}</div>
          <div class="ambient-key">Is bright</div>
          <div class="ambient-value" data-testid="ambient-is-bright">${d}</div>
          <div class="ambient-key">Source method</div>
          <div class="ambient-value" data-testid="ambient-source-method">${o}</div>
          <div class="ambient-key">Source sensor</div>
          <div class="ambient-value" data-testid="ambient-source-sensor">${a}</div>
          <div class="ambient-key">Source location</div>
          <div class="ambient-value" data-testid="ambient-source-location">${r}</div>
        </div>

        <div class="policy-note" style="margin-bottom: 8px;">
          Lux sensor assignment is explicit. Set a location sensor or inherit from parent.
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Lux sensor</div>
            <div class="config-help">Choose a mapped illuminance sensor for this location.</div>
          </div>
          <div class="config-value">
            <select
              .value=${p}
              ?disabled=${f}
              data-testid="ambient-lux-sensor-select"
              @change=${(h) => {
      const g = h.target.value.trim();
      this._updateAmbientConfig({
        ...t,
        lux_sensor: g || null
      });
    }}
            >
              <option value="">Use inherited/default sensor</option>
              ${i.map((h) => _`<option value=${h}>${this._entityName(h)}</option>`)}
            </select>
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Inherit from parent</div>
            <div class="config-help">Use ancestor ambient sensor if this location has no direct sensor.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${!!t.inherit_from_parent}
              ?disabled=${f}
              data-testid="ambient-inherit-toggle"
              @change=${(h) => void this._updateAmbientConfig({
      ...t,
      inherit_from_parent: h.target.checked
    })}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Dark threshold (lux)</div>
            <div class="config-help">Dark when lux is below this value.</div>
          </div>
          <div class="config-value">
            <input
              type="number"
              min="0"
              step="1"
              class="input"
              .value=${String(u)}
              ?disabled=${f}
              data-testid="ambient-dark-threshold"
              @change=${(h) => {
      const g = Math.max(0, Number(h.target.value) || 0);
      this._updateAmbientConfig({
        ...t,
        dark_threshold: g,
        bright_threshold: Math.max(g + 1, Number(t.bright_threshold) || g + 1)
      });
    }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Bright threshold (lux)</div>
            <div class="config-help">Bright when lux is above this value.</div>
          </div>
          <div class="config-value">
            <input
              type="number"
              min=${String(u + 1)}
              step="1"
              class="input"
              .value=${String(l)}
              ?disabled=${f}
              data-testid="ambient-bright-threshold"
              @change=${(h) => {
      const g = Math.max(
        u + 1,
        Number(h.target.value) || u + 1
      );
      this._updateAmbientConfig({
        ...t,
        bright_threshold: g
      });
    }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Fallback to sun</div>
            <div class="config-help">Use sunrise/sunset state when no lux sensor reading is available.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${!!t.fallback_to_sun}
              ?disabled=${f}
              data-testid="ambient-fallback-to-sun-toggle"
              @change=${(h) => void this._updateAmbientConfig({
      ...t,
      fallback_to_sun: h.target.checked
    })}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Assume dark on error</div>
            <div class="config-help">When fallback to sun is disabled, treat unavailable readings as dark.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${!!t.assume_dark_on_error}
              ?disabled=${f}
              data-testid="ambient-assume-dark-on-error-toggle"
              @change=${(h) => void this._updateAmbientConfig({
      ...t,
      assume_dark_on_error: h.target.checked
    })}
            />
          </div>
        </div>
      </div>
    `;
  }
  _isManagedShadowHost() {
    if (!this.location || this.location.is_explicit_root) return !1;
    const t = U(this.location);
    return t === "floor" || t === "building" || t === "grounds";
  }
  _currentManagedShadowAreaId() {
    return !this._isManagedShadowHost() || !this.location ? "" : to(this.location);
  }
  _managedShadowAreaById(t) {
    return (this.allLocations || []).find((e) => e.id === t);
  }
  _managedShadowAreaLabel(t) {
    var n, o, a;
    const e = this._managedShadowAreaById(t);
    return e ? (e.ha_area_id ? (a = (o = (n = this.hass) == null ? void 0 : n.areas) == null ? void 0 : o[e.ha_area_id]) == null ? void 0 : a.name : void 0) || e.name : t;
  }
  _renderManagedShadowAreaSection() {
    var d;
    if (!this._isManagedShadowHost() || !this.location) return "";
    const t = this.location.id, e = this._currentManagedShadowAreaId(), i = e ? this._managedShadowAreaById(e) : void 0, n = ((d = i == null ? void 0 : i.modules) == null ? void 0 : d._meta) || {}, o = String(n.role || "").trim().toLowerCase() === "managed_shadow", a = String(n.shadow_for_location_id || "").trim(), r = !!(i && i.ha_area_id && i.parent_id === t && o && a === t), c = e ? this._managedShadowAreaLabel(e) : "Not configured";
    return _`
      <div class="card-section" data-testid="managed-shadow-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Managed System Area
        </div>
        <div class="policy-note">
          Topomation owns this mapping. Assignments to this ${U(this.location)} are
          remapped to a managed shadow HA area for native area_id interoperability.
        </div>
        <div class="subsection-help">
          Current system area: ${c}
        </div>
        ${e ? "" : _`
              <div class="policy-warning">
                Missing managed system area. It will be created automatically during sync/reconciliation.
              </div>
            `}
        ${e && !r ? _`
              <div class="policy-warning">
                Managed system area metadata is inconsistent. Topomation will repair it on next reconciliation.
              </div>
            ` : ""}
      </div>
    `;
  }
  _linkedLocationFloorParentId() {
    if (!this.location || U(this.location) !== "area") return null;
    const t = this.location.parent_id ?? null;
    if (!t) return null;
    const e = (this.allLocations || []).find((i) => i.id === t);
    return !e || U(e) !== "floor" ? null : t;
  }
  _linkedLocationCandidates() {
    if (!this.location) return [];
    const t = this._linkedLocationFloorParentId();
    if (!t) return [];
    const e = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((i) => i.id !== this.location.id).filter((i) => (i.parent_id ?? null) === t).filter((i) => U(i) === "area").filter((i) => !this._isManagedShadowLocation(i, e)).sort((i, n) => i.name.localeCompare(n.name));
  }
  _isManagedShadowLocation(t, e) {
    return $e(t, e);
  }
  _managedShadowLocationIds() {
    return Se(this.allLocations || []);
  }
  _normalizeLinkedLocationIds(t, e, i) {
    if (!Array.isArray(t))
      return [];
    const n = /* @__PURE__ */ new Set(), o = [];
    for (const a of t) {
      if (typeof a != "string") continue;
      const r = a.trim();
      !r || n.has(r) || i && r === i || e && !e.has(r) || (n.add(r), o.push(r));
    }
    return o;
  }
  _linkedLocationIds(t) {
    if (!this.location)
      return [];
    const e = new Set(this._linkedLocationCandidates().map((n) => n.id));
    if (e.size === 0)
      return [];
    const i = this._stagedLinkedLocations ?? t.linked_locations;
    return this._normalizeLinkedLocationIds(i, e, this.location.id);
  }
  _syncLocationIds(t) {
    if (!this.location)
      return [];
    const e = new Set(this._linkedLocationCandidates().map((n) => n.id));
    if (e.size === 0)
      return [];
    const i = this._stagedSyncLocations ?? t.sync_locations;
    return this._normalizeLinkedLocationIds(i, e, this.location.id);
  }
  _linkedLocationArraysEqual(t, e) {
    return !t || t.length !== e.length ? !1 : t.every((i, n) => i === e[n]);
  }
  _candidateLinkedLocationIds(t) {
    var i;
    const e = (((i = t.modules) == null ? void 0 : i.occupancy) || {}).linked_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _candidateSyncLocationIds(t) {
    var i;
    const e = (((i = t.modules) == null ? void 0 : i.occupancy) || {}).sync_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _isTwoWayLinked(t, e) {
    return !this.location || !e.has(t.id) ? !1 : this._candidateLinkedLocationIds(t).includes(this.location.id);
  }
  _persistLinkedLocationsFor(t, e) {
    var o;
    const n = {
      ...((o = t.modules) == null ? void 0 : o.occupancy) || {},
      linked_locations: e
    };
    return this.hass.callWS(
      this._withEntryId({
        type: "topomation/locations/set_module_config",
        location_id: t.id,
        module_id: "occupancy",
        config: n
      })
    ).then(() => {
      t.modules = t.modules || {}, t.modules.occupancy = n, this.requestUpdate();
    });
  }
  _persistSyncLocationsFor(t, e) {
    var o;
    const n = {
      ...((o = t.modules) == null ? void 0 : o.occupancy) || {},
      sync_locations: e
    };
    return this.hass.callWS(
      this._withEntryId({
        type: "topomation/locations/set_module_config",
        location_id: t.id,
        module_id: "occupancy",
        config: n
      })
    ).then(() => {
      t.modules = t.modules || {}, t.modules.occupancy = n, this.requestUpdate();
    });
  }
  _enqueueLinkedPersist(t) {
    this._linkedPersistQueueDepth += 1, this._savingLinkedLocations = !0, this._linkedPersistChain = this._linkedPersistChain.then(t).catch((e) => {
      const i = (e == null ? void 0 : e.message) || "Failed to save linked rooms";
      console.error("Failed to persist linked room update", e), this._showToast(i, "error");
    }).finally(() => {
      this._linkedPersistQueueDepth = Math.max(0, this._linkedPersistQueueDepth - 1), this._linkedPersistQueueDepth === 0 && (this._savingLinkedLocations = !1);
    });
  }
  _toggleLinkedLocation(t, e) {
    if (!this.location) return;
    const i = this.location, n = i.id, o = this._getOccupancyConfig(), a = new Set(this._linkedLocationIds(o));
    e ? a.add(t) : a.delete(t);
    const r = [...a].sort(
      (c, d) => this._locationName(c).localeCompare(this._locationName(d))
    );
    this._stagedLinkedLocations = r, this._enqueueLinkedPersist(async () => {
      var c;
      await this._persistLinkedLocationsFor(i, r), ((c = this.location) == null ? void 0 : c.id) === n && this._linkedLocationArraysEqual(this._stagedLinkedLocations, r) && (this._stagedLinkedLocations = void 0), this._showToast("Linked rooms updated", "success");
    });
  }
  _toggleSyncLocation(t, e) {
    if (!this.location) return;
    const i = this.location, n = i.id, o = this._getOccupancyConfig(), a = new Set(this._syncLocationIds(o)), r = new Set(this._candidateSyncLocationIds(t));
    e ? (a.add(t.id), r.add(n)) : (a.delete(t.id), r.delete(n));
    const c = [...a].sort(
      (u, l) => this._locationName(u).localeCompare(this._locationName(l))
    ), d = [...r].sort(
      (u, l) => this._locationName(u).localeCompare(this._locationName(l))
    );
    this._stagedSyncLocations = c, this._enqueueLinkedPersist(async () => {
      var u;
      await this._persistSyncLocationsFor(i, c), ((u = this.location) == null ? void 0 : u.id) === n && this._linkedLocationArraysEqual(this._stagedSyncLocations, c) && (this._stagedSyncLocations = void 0), await this._persistSyncLocationsFor(t, d), this._showToast(
        e ? `Synced occupancy with ${t.name}` : `Removed occupancy sync with ${t.name}`,
        "success"
      );
    });
  }
  _toggleTwoWayLinkedLocation(t, e) {
    if (!this.location) return;
    const i = this.location, n = i.id, o = this._getOccupancyConfig(), a = new Set(this._linkedLocationIds(o));
    let r;
    e && !a.has(t.id) && (a.add(t.id), r = [...a].sort(
      (u, l) => this._locationName(u).localeCompare(this._locationName(l))
    ), this._stagedLinkedLocations = r);
    const c = new Set(this._candidateLinkedLocationIds(t));
    e ? c.add(n) : c.delete(n);
    const d = [...c].sort(
      (u, l) => this._locationName(u).localeCompare(this._locationName(l))
    );
    this._enqueueLinkedPersist(async () => {
      var u;
      r && (await this._persistLinkedLocationsFor(i, r), ((u = this.location) == null ? void 0 : u.id) === n && this._linkedLocationArraysEqual(this._stagedLinkedLocations, r) && (this._stagedLinkedLocations = void 0)), await this._persistLinkedLocationsFor(t, d), this._showToast(
        e ? `Enabled two-way link with ${t.name}` : `Disabled two-way link with ${t.name}`,
        "success"
      );
    });
  }
  _renderSyncLocationsSection(t) {
    if (!this.location) return "";
    if (!!!this._linkedLocationFloorParentId())
      return _`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
            Sync Rooms
          </div>
          <div class="subsection-help">
            Sync Rooms is available only for area locations directly under a floor.
          </div>
        </div>
      `;
    const i = this._linkedLocationCandidates(), n = this._syncLocationIds(t), o = new Set(n), a = n.length ? n.map((r) => this._locationName(r)).join(", ") : "None";
    return _`
      <div class="card-section" data-testid="sync-rooms-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
          Sync Rooms
        </div>
        <div class="subsection-help">
          <strong>Recommended:</strong> synced rooms share the same occupancy state and timeout.
          Any occupancy change in one synced room is mirrored to all others.
        </div>
        <div class="linked-location-meta">Synced with: ${a}</div>
        ${i.length === 0 ? _`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>` : _`
              <div class="linked-location-list">
                ${i.map((r) => {
      const c = o.has(r.id);
      return _`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`sync-location-${r.id}`}
                          .checked=${c}
                          @change=${(d) => {
        const u = d.target;
        this._toggleSyncLocation(r, u.checked);
      }}
                        />
                        <span class="linked-location-name">${r.name}</span>
                      </label>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderLinkedLocationsSection(t) {
    if (!this.location) return "";
    if (!!!this._linkedLocationFloorParentId())
      return _`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
            Directional Contributors
          </div>
          <div class="subsection-help">
            Directional contributors are available only for area locations directly under a floor.
          </div>
        </div>
      `;
    const i = this._linkedLocationCandidates(), n = this._linkedLocationIds(t), o = new Set(this._syncLocationIds(t)), a = new Set(n), r = n.length ? n.map((c) => this._locationName(c)).join(", ") : "None";
    return _`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Directional Contributors
        </div>
        <div class="subsection-help">
          Advanced: select locations that can contribute occupancy to this location directionally.
          Configure reverse direction from the other location if needed.
        </div>
        <div class="linked-location-meta">Contributors: ${r}</div>
        ${i.length === 0 ? _`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>` : _`
              <div class="linked-location-list">
                ${i.map((c) => {
      const d = a.has(c.id), u = o.has(c.id), l = this._isTwoWayLinked(c, a);
      return _`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-${c.id}`}
                          .checked=${d}
                          ?disabled=${u}
                          @change=${(p) => {
        const f = p.target;
        this._toggleLinkedLocation(c.id, f.checked);
      }}
                        />
                        <span class="linked-location-name">${c.name}</span>
                      </label>
                      <label class="linked-location-right">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-two-way-${c.id}`}
                          .checked=${l}
                          ?disabled=${!d || u}
                          @change=${(p) => {
        const f = p.target;
        this._toggleTwoWayLinkedLocation(c, f.checked);
      }}
                        />
                        <span class="linked-location-two-way-label">2-way</span>
                      </label>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderAdjacencyAdvancedSection(t) {
    const e = this._showAdvancedAdjacency;
    return _`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:beaker-outline"}></ha-icon>
          Advanced Occupancy Relationships
        </div>
        <div class="subsection-help">
          Directional contributors and movement handoff are advanced tools.
          Most homes should start with Sync Rooms.
        </div>
        <div class="advanced-toggle-row">
          <button
            class="button button-secondary"
            data-testid="adjacency-advanced-toggle"
            @click=${() => {
      this._showAdvancedAdjacency = !this._showAdvancedAdjacency;
    }}
          >
            ${e ? "Hide Advanced Controls" : "Show Advanced Controls"}
          </button>
        </div>
      </div>
      ${e ? _`${this._renderLinkedLocationsSection(t)} ${this._renderAdjacencySection()} ${this._renderHandoffTraceSection()}` : ""}
    `;
  }
  _adjacencyCandidates() {
    if (!this.location) return [];
    const t = U(this.location);
    if (t !== "area" && t !== "subarea")
      return [];
    const e = this.location.parent_id ?? null, i = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((n) => n.id !== this.location.id).filter((n) => (n.parent_id ?? null) === e).filter((n) => !this._isManagedShadowLocation(n, i)).filter((n) => {
      const o = U(n);
      return o === "area" || o === "subarea";
    }).sort((n, o) => n.name.localeCompare(o.name));
  }
  _connectedAdjacencyEdges() {
    if (!this.location) return [];
    const t = this.location.id;
    return (this.adjacencyEdges || []).filter(
      (e) => e && (e.from_location_id === t || e.to_location_id === t)
    ).sort((e, i) => {
      const n = this._adjacentLocationName(e), o = this._adjacentLocationName(i);
      return n.localeCompare(o);
    });
  }
  _adjacentLocationId(t) {
    return this.location ? t.from_location_id === this.location.id ? t.to_location_id : t.from_location_id : t.to_location_id;
  }
  _adjacentLocationName(t) {
    var i;
    const e = this._adjacentLocationId(t);
    return ((i = this.allLocations.find((n) => n.id === e)) == null ? void 0 : i.name) || e;
  }
  _edgeDirectionLabel(t) {
    if (!this.location) return t.directionality;
    if (t.directionality === "bidirectional") return "Two-way";
    const e = this.location.id;
    return t.directionality === "a_to_b" && t.from_location_id === e || t.directionality === "b_to_a" && t.to_location_id === e ? "Outbound" : "Inbound";
  }
  _parseCrossingSources(t) {
    return t.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
  }
  _emitAdjacencyChanged() {
    this.dispatchEvent(
      new CustomEvent("adjacency-changed", {
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _handleAdjacencyCreate() {
    var e;
    const t = this._adjacencyNeighborId || ((e = this._adjacencyCandidates()[0]) == null ? void 0 : e.id) || "";
    if (!(!this.location || !t || this._savingAdjacency)) {
      this._savingAdjacency = !0;
      try {
        let i = this.location.id, n = t, o = "bidirectional";
        this._adjacencyDirection === "outbound" ? o = "a_to_b" : this._adjacencyDirection === "inbound" && (i = t, n = this.location.id, o = "a_to_b"), await this.hass.callWS(
          this._withEntryId({
            type: "topomation/adjacency/create",
            from_location_id: i,
            to_location_id: n,
            directionality: o,
            boundary_type: this._adjacencyBoundaryType,
            crossing_sources: this._parseCrossingSources(this._adjacencyCrossingSources),
            handoff_window_sec: this._adjacencyHandoffWindowSec,
            priority: this._adjacencyPriority
          })
        ), this._adjacencyCrossingSources = "", this._showToast("Adjacency edge created", "success"), this._emitAdjacencyChanged();
      } catch (i) {
        console.error("Failed to create adjacency edge:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to create adjacency edge", "error");
      } finally {
        this._savingAdjacency = !1;
      }
    }
  }
  async _handleAdjacencyDelete(t) {
    if (!(!t || this._savingAdjacency)) {
      this._savingAdjacency = !0;
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/adjacency/delete",
            edge_id: t
          })
        ), this._showToast("Adjacency edge deleted", "success"), this._emitAdjacencyChanged();
      } catch (e) {
        console.error("Failed to delete adjacency edge:", e), this._showToast((e == null ? void 0 : e.message) || "Failed to delete adjacency edge", "error");
      } finally {
        this._savingAdjacency = !1;
      }
    }
  }
  _renderAdjacencySection() {
    var a;
    if (!this.location) return "";
    const t = this._adjacencyCandidates(), e = this._connectedAdjacencyEdges(), i = this._adjacencyNeighborId || ((a = t[0]) == null ? void 0 : a.id) || "", n = !!i && !this._savingAdjacency, o = t.length === 0;
    return _`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:graph-outline"}></ha-icon>
          Adjacent Locations
        </div>
        <div class="subsection-help">
          Model pathways between neighboring locations so wasp-in-box handoffs can reason about movement.
        </div>

        ${e.length === 0 ? _`<div class="adjacency-empty">No adjacency edges for this location yet.</div>` : _`
              <div class="adjacency-list">
                ${e.map((r) => _`
                  <div class="adjacency-row">
                    <div class="adjacency-row-head">
                      <div class="adjacency-neighbor">${this._adjacentLocationName(r)}</div>
                      <button
                        class="button button-secondary adjacency-delete-btn"
                        ?disabled=${this._savingAdjacency}
                        @click=${() => this._handleAdjacencyDelete(r.edge_id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div class="adjacency-meta">
                      ${this._edgeDirectionLabel(r)} • ${r.boundary_type} •
                      handoff ${r.handoff_window_sec}s • priority ${r.priority}
                    </div>
                    ${Array.isArray(r.crossing_sources) && r.crossing_sources.length > 0 ? _`
                          <div class="adjacency-meta">
                            crossings: ${r.crossing_sources.join(", ")}
                          </div>
                        ` : ""}
                  </div>
                `)}
              </div>
            `}

        <div class="adjacency-form">
          <div class="adjacency-form-grid">
            <div class="adjacency-form-field">
              <label for="adjacency-neighbor">Neighbor</label>
                <select
                id="adjacency-neighbor"
                .value=${i}
                ?disabled=${o || this._savingAdjacency}
                @change=${(r) => {
      const c = r.target;
      this._adjacencyNeighborId = c.value;
    }}
              >
                ${t.map((r) => _`
                  <option value=${r.id}>${r.name}</option>
                `)}
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-direction">Direction</label>
              <select
                id="adjacency-direction"
                .value=${this._adjacencyDirection}
                ?disabled=${this._savingAdjacency}
                @change=${(r) => {
      const c = r.target;
      this._adjacencyDirection = c.value;
    }}
              >
                <option value="bidirectional">Two-way</option>
                <option value="outbound">This to neighbor</option>
                <option value="inbound">Neighbor to this</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-boundary">Boundary</label>
              <select
                id="adjacency-boundary"
                .value=${this._adjacencyBoundaryType}
                ?disabled=${this._savingAdjacency}
                @change=${(r) => {
      const c = r.target;
      this._adjacencyBoundaryType = c.value;
    }}
              >
                <option value="door">Door</option>
                <option value="archway">Archway</option>
                <option value="corridor">Corridor</option>
                <option value="stairs">Stairs</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-handoff">Handoff Window (sec)</label>
              <input
                id="adjacency-handoff"
                type="number"
                min="1"
                max="300"
                .value=${String(this._adjacencyHandoffWindowSec)}
                ?disabled=${this._savingAdjacency}
                @input=${(r) => {
      const c = r.target, d = Number.parseInt(c.value || "12", 10);
      this._adjacencyHandoffWindowSec = Number.isNaN(d) ? 12 : Math.max(1, Math.min(300, d));
    }}
              />
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-priority">Priority</label>
              <input
                id="adjacency-priority"
                type="number"
                min="0"
                max="1000"
                .value=${String(this._adjacencyPriority)}
                ?disabled=${this._savingAdjacency}
                @input=${(r) => {
      const c = r.target, d = Number.parseInt(c.value || "50", 10);
      this._adjacencyPriority = Number.isNaN(d) ? 50 : Math.max(0, Math.min(1e3, d));
    }}
              />
            </div>
          </div>
          <div class="adjacency-form-field">
            <label for="adjacency-crossings">Crossing sources (comma-separated entity IDs)</label>
            <input
              id="adjacency-crossings"
              type="text"
              placeholder="binary_sensor.hallway_beam, binary_sensor.kitchen_door"
              .value=${this._adjacencyCrossingSources}
              ?disabled=${this._savingAdjacency}
              @input=${(r) => {
      const c = r.target;
      this._adjacencyCrossingSources = c.value;
    }}
            />
          </div>
          <div class="adjacency-form-actions">
            <button
              class="button button-primary"
              ?disabled=${!n || o}
              @click=${this._handleAdjacencyCreate}
            >
              Add Adjacency
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _locationName(t) {
    var e, i;
    return ((e = this.location) == null ? void 0 : e.id) === t ? this.location.name : ((i = this.allLocations.find((n) => n.id === t)) == null ? void 0 : i.name) || t;
  }
  _formatHandoffStatus(t) {
    const e = t.trim();
    return e ? e.split("_").filter((i) => i.length > 0).map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(" ") : "Unknown";
  }
  _renderHandoffTraceSection() {
    if (!this.location) return "";
    const t = Array.isArray(this.handoffTraces) ? this.handoffTraces : [];
    return _`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:swap-horizontal-bold"}></ha-icon>
          Handoff Trace
        </div>
        <div class="subsection-help">
          Recent adjacency handoff triggers touching this location. Use this to validate wasp-in-box
          movement assumptions and crossing-source tuning.
        </div>
        ${t.length === 0 ? _`<div class="adjacency-empty">No recent handoff traces for this location.</div>` : _`
              <div class="handoff-trace-list">
                ${t.map((e) => {
      const i = this._parseDateValue(e.timestamp), n = i ? this._formatDateTime(i) : e.timestamp, o = `${this._locationName(e.from_location_id)} -> ${this._locationName(e.to_location_id)}`, a = e.trigger_entity_id || e.trigger_source_id || "unknown";
      return _`
                    <div class="handoff-trace-row">
                      <div class="handoff-trace-head">
                        <span class="handoff-trace-route">${o}</span>
                        <span class="handoff-trace-time">${n}</span>
                      </div>
                      <div class="handoff-trace-meta">
                        ${this._formatHandoffStatus(e.status)} • ${e.boundary_type} • window
                        ${e.handoff_window_sec}s
                      </div>
                      <div class="handoff-trace-meta">trigger: ${a}</div>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderRuntimeStatus(t) {
    const e = this._getOccupancyState(), i = this._resolveOccupiedState(e);
    if (!e && i === void 0)
      return _`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${t.isLocked ? _`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    const n = (e == null ? void 0 : e.attributes) || {}, o = i === !0, a = this._resolveVacantAt(n, o), r = i === !0 ? "Occupied" : i === !1 ? "Vacant" : "Unknown", c = o ? this._formatVacantAtLabel(a) : "-";
    return _`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${o ? "occupied" : "vacant"}">${r}</span>
          <span class="status-chip ${t.isLocked ? "locked" : ""}">
            ${t.isLocked ? "Locked" : "Unlocked"}
          </span>
        </div>
        <div class="runtime-summary-grid">
          <div class="runtime-summary-key">Vacant at</div>
          <div class="runtime-summary-value" data-testid="runtime-vacant-at">${c}</div>
          <div class="runtime-summary-key">Lock</div>
          <div class="runtime-summary-value">${t.isLocked ? "Locked" : "Unlocked"}</div>
        </div>
      </div>
    `;
  }
  _isMediaEntity(t) {
    return t.startsWith("media_player.");
  }
  _mediaSignalLabel(t) {
    return t === "color" ? "Color changes" : t === "power" ? "Power changes" : t === "level" ? "Brightness changes" : t === "volume" ? "Volume changes" : t === "mute" ? "Mute changes" : "Playback";
  }
  _signalDescription(t) {
    return t === "color" ? "RGB/color changes" : t === "power" ? "on/off" : t === "level" ? "brightness changes" : t === "volume" ? "volume changes" : t === "mute" ? "mute/unmute" : "playback start/stop";
  }
  _sourceKey(t, e) {
    return e ? `${t}::${e}` : t;
  }
  _sourceKeyFromSource(t) {
    const e = this._normalizedSignalKeyForSource(t);
    return this._sourceKey(t.entity_id, e);
  }
  _sourceCardGroupKey(t) {
    const e = this._normalizedSignalKey(t.entityId, t.signalKey);
    return t.entityId.startsWith("light.") && (e === "power" || e === "level" || e === "color") ? `${t.entityId}::power-level` : t.entityId.startsWith("media_player.") && (e === "playback" || e === "volume" || e === "mute") ? `${t.entityId}::media-signals` : t.key;
  }
  _isLightSignalKey(t) {
    return t === "power" || t === "level" || t === "color";
  }
  _isMediaSignalKey(t) {
    return t === "playback" || t === "volume" || t === "mute";
  }
  _isIntegratedLightGroup(t) {
    return t.length > 1 && t[0].entityId.startsWith("light.") && t.every((e) => e.entityId === t[0].entityId);
  }
  _isIntegratedMediaGroup(t) {
    return t.length > 1 && t[0].entityId.startsWith("media_player.") && t.every((e) => e.entityId === t[0].entityId);
  }
  _defaultSignalKeyForEntity(t) {
    if (this._isMediaEntity(t)) return "playback";
    if (this._isDimmableEntity(t) || this._isColorCapableEntity(t)) return "power";
  }
  _candidateItemsForEntity(t) {
    if (!this._isMediaEntity(t)) {
      const e = this._isDimmableEntity(t), i = this._isColorCapableEntity(t);
      if (!e && !i)
        return [{ key: this._sourceKey(t), entityId: t }];
      const n = ["power"];
      return e && n.push("level"), i && n.push("color"), n.map((o) => ({
        key: this._sourceKey(t, o),
        entityId: t,
        signalKey: o
      }));
    }
    return ["playback", "volume", "mute"].map((e) => ({
      key: this._sourceKey(t, e),
      entityId: t,
      signalKey: e
    }));
  }
  _signalSortWeight(t) {
    return !t || t === "power" || t === "playback" ? 0 : t === "level" || t === "volume" ? 1 : t === "color" || t === "mute" ? 2 : 3;
  }
  _candidateTitle(t, e) {
    const i = this._normalizedSignalKey(t, e), n = this._entityName(t);
    return i && (t.startsWith("media_player.") || t.startsWith("light.")) ? `${n} — ${this._mediaSignalLabel(i)}` : !this._isMediaEntity(t) && !this._isDimmableEntity(t) && !this._isColorCapableEntity(t) ? n : `${n} — ${this._mediaSignalLabel(i)}`;
  }
  _normalizedSignalKeyForSource(t) {
    var n;
    const e = (n = t.source_id) != null && n.includes("::") ? t.source_id.split("::")[1] : void 0, i = t.signal_key || e;
    return this._normalizedSignalKey(t.entity_id, i);
  }
  _normalizedSignalKey(t, e) {
    return e || this._defaultSignalKeyForEntity(t);
  }
  _mediaSignalDefaults(t, e) {
    return e === "playback" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "playback"),
      signal_key: "playback",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, e),
      signal_key: e,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _lightSignalDefaults(t, e) {
    return e === "power" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "power"),
      signal_key: "power",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : e === "color" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "color"),
      signal_key: "color",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _isDimmableEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const n = e.attributes || {};
    if (typeof n.brightness == "number") return !0;
    const o = n.supported_color_modes;
    return Array.isArray(o) ? o.some((c) => c && c !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const n = e.attributes || {};
    if (n.rgb_color || n.hs_color || n.xy_color) return !0;
    const o = n.supported_color_modes;
    return Array.isArray(o) ? o.some((c) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(c)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), n = /* @__PURE__ */ new Map();
    i.forEach((g, m) => n.set(this._sourceKeyFromSource(g), m));
    const o = new Set(this.location.entity_ids || []);
    if (this.location.ha_area_id)
      for (const g of this._entitiesForArea(this.location.ha_area_id))
        o.add(g);
    const c = [...o].sort(
      (g, m) => this._entityName(g).localeCompare(this._entityName(m))
    ).filter((g) => this._isCoreAreaSourceEntity(g)).flatMap(
      (g) => this._candidateItemsForEntity(g)
    ), d = c, u = new Set(c.map((g) => g.key)), l = i.filter((g) => !u.has(this._sourceKeyFromSource(g))).map((g) => ({
      key: this._sourceKeyFromSource(g),
      entityId: g.entity_id,
      signalKey: this._normalizedSignalKeyForSource(g)
    })), p = [...d, ...l].sort((g, m) => {
      const v = n.has(g.key), S = n.has(m.key);
      if (v !== S) return v ? -1 : 1;
      const $ = this._entityName(g.entityId).localeCompare(this._entityName(m.entityId));
      return $ !== 0 ? $ : this._signalSortWeight(g.signalKey) - this._signalSortWeight(m.signalKey);
    }), f = [], h = /* @__PURE__ */ new Map();
    for (const g of p) {
      const m = this._sourceCardGroupKey(g), v = h.get(m);
      if (v) {
        v.items.push(g);
        continue;
      }
      const S = { key: m, items: [g] };
      h.set(m, S), f.push(S);
    }
    return f.length ? _`
      <div class="candidate-list">
        ${Xe(f, (g) => g.key, (g) => {
      if (this._isIntegratedLightGroup(g.items))
        return this._renderIntegratedLightCard(t, g.items, i, n);
      if (this._isIntegratedMediaGroup(g.items))
        return this._renderIntegratedMediaCard(t, g.items, i, n);
      const m = g.items.some((v) => n.has(v.key));
      return _`
            <div class="source-card ${m ? "enabled" : ""}">
              ${Xe(g.items, (v) => v.key, (v, S) => {
        const $ = n.get(v.key), x = $ !== void 0, j = x ? i[$] : void 0, N = x && j ? j : void 0, q = this._modeOptionsForEntity(v.entityId);
        return _`
                  <div class=${`source-card-item${S > 0 ? " grouped" : ""}`}>
                    <div class="candidate-item">
                      <div class="source-enable-control">
                        <input
                          type="checkbox"
                          class="source-enable-input"
                          aria-label="Include source"
                          .checked=${x}
                          @change=${(R) => {
          const O = R.target.checked;
          O && !x ? this._addSourceWithDefaults(v.entityId, t, {
            resetExternalPicker: !1,
            signalKey: v.signalKey
          }) || this.requestUpdate() : !O && x && this._removeSource($, t);
        }}
                        />
                      </div>
                      <div>
                        <div class="candidate-headline">
                          <div class="candidate-title">
                            ${this._candidateTitle(v.entityId, v.signalKey)}
                            <span class="candidate-entity-inline">[${v.entityId}]</span>
                          </div>
                          <div class="candidate-controls">
                            <span class="source-state-pill">${this._entityState(v.entityId)}</span>
                            ${x && N && q.length > 1 ? _`
                                  <div class="inline-mode-group">
                                    <span class="inline-mode-label">Mode</span>
                                    <select
                                      class="inline-mode-select"
                                      .value=${q.some((R) => R.value === N.mode) ? N.mode : q[0].value}
                                      @change=${(R) => {
          const O = R.target.value, L = this.hass.states[v.entityId], C = We(N, O, L);
          this._updateSourceDraft(t, $, { ...C, entity_id: N.entity_id });
        }}
                                    >
                                      ${q.map((R) => _`<option value=${R.value}>${R.label}</option>`)}
                                    </select>
                                  </div>
                                ` : ""}
                          </div>
                        </div>
                        ${(this._isMediaEntity(v.entityId) || v.entityId.startsWith("light.")) && v.signalKey ? _`<div class="candidate-submeta">Activity trigger: ${this._mediaSignalLabel(v.signalKey)}</div>` : ""}
                      </div>
                    </div>
                    ${x && j ? this._renderSourceEditor(t, j, $) : ""}
                  </div>
                `;
      })}
            </div>
          `;
    })}
      </div>
    ` : _`
        <div class="empty-state">
          <div class="text-muted">
            ${e ? _`No occupancy-relevant entities found yet. Add one from another area to get started.` : _`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
  }
  _renderIntegratedLightCard(t, e, i, n) {
    var f;
    const o = (f = e[0]) == null ? void 0 : f.entityId;
    if (!o) return "";
    const a = [...e].filter((h) => this._isLightSignalKey(h.signalKey)).sort((h, g) => this._signalSortWeight(h.signalKey) - this._signalSortWeight(g.signalKey));
    if (a.length === 0) return "";
    const r = a.filter((h) => n.has(h.key)), c = r.length > 0, d = r.find((h) => h.signalKey === "power") || r[0] || a[0], u = n.get(d.key), l = u !== void 0 ? i[u] : void 0, p = this._modeOptionsForEntity(o);
    return _`
      <div class="source-card ${c ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include light source"
                .checked=${c}
                @change=${(h) => {
      var m;
      const g = h.target.checked;
      if (g && !c) {
        const v = ((m = a.find(($) => $.signalKey === "power")) == null ? void 0 : m.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(o, t, {
          resetExternalPicker: !1,
          signalKey: v
        }) || this.requestUpdate();
        return;
      }
      !g && c && this._removeSourcesByKey(
        a.map((v) => v.key),
        t
      );
    }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(o)}
                  <span class="candidate-entity-inline">[${o}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(o)}</span>
                  ${l && u !== void 0 && p.length > 1 ? _`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((h) => h.value === l.mode) ? l.mode : p[0].value}
                            @change=${(h) => {
      const g = h.target.value, m = this.hass.states[o], v = We(l, g, m);
      this._updateSourceDraft(t, u, {
        ...v,
        entity_id: l.entity_id
      });
    }}
                          >
                            ${p.map((h) => _`<option value=${h.value}>${h.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((h) => {
      const g = n.has(h.key);
      return _`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${g}
                        @change=${(m) => {
        const v = m.target.checked;
        if (v && !g) {
          this._addSourceWithDefaults(o, t, {
            resetExternalPicker: !1,
            signalKey: h.signalKey
          }) || this.requestUpdate();
          return;
        }
        !v && g && this._removeSourcesByKey([h.key], t);
      }}
                      />
                      <span>${this._mediaSignalLabel(h.signalKey)}</span>
                    </label>
                  `;
    })}
              </div>
            </div>
          </div>
          ${l && u !== void 0 ? this._renderSourceEditor(t, l, u) : ""}
        </div>
      </div>
    `;
  }
  _renderIntegratedMediaCard(t, e, i, n) {
    var f;
    const o = (f = e[0]) == null ? void 0 : f.entityId;
    if (!o) return "";
    const a = [...e].filter((h) => this._isMediaSignalKey(h.signalKey)).sort((h, g) => this._signalSortWeight(h.signalKey) - this._signalSortWeight(g.signalKey));
    if (a.length === 0) return "";
    const r = a.filter((h) => n.has(h.key)), c = r.length > 0, d = r.find((h) => h.signalKey === "playback") || r[0] || a[0], u = n.get(d.key), l = u !== void 0 ? i[u] : void 0, p = this._modeOptionsForEntity(o);
    return _`
      <div class="source-card ${c ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include media source"
                .checked=${c}
                @change=${(h) => {
      var m;
      const g = h.target.checked;
      if (g && !c) {
        const v = ((m = a.find(($) => $.signalKey === "playback")) == null ? void 0 : m.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(o, t, {
          resetExternalPicker: !1,
          signalKey: v
        }) || this.requestUpdate();
        return;
      }
      !g && c && this._removeSourcesByKey(
        a.map((v) => v.key),
        t
      );
    }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(o)}
                  <span class="candidate-entity-inline">[${o}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(o)}</span>
                  ${l && u !== void 0 && p.length > 1 ? _`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((h) => h.value === l.mode) ? l.mode : p[0].value}
                            @change=${(h) => {
      const g = h.target.value, m = this.hass.states[o], v = We(l, g, m);
      this._updateSourceDraft(t, u, {
        ...v,
        entity_id: l.entity_id
      });
    }}
                          >
                            ${p.map((h) => _`<option value=${h.value}>${h.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((h) => {
      const g = n.has(h.key);
      return _`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${g}
                        @change=${(m) => {
        const v = m.target.checked;
        if (v && !g) {
          this._addSourceWithDefaults(o, t, {
            resetExternalPicker: !1,
            signalKey: h.signalKey
          }) || this.requestUpdate();
          return;
        }
        !v && g && this._removeSourcesByKey([h.key], t);
      }}
                      />
                      <span>${this._mediaSignalLabel(h.signalKey)}</span>
                    </label>
                  `;
    })}
              </div>
            </div>
          </div>
          ${l && u !== void 0 ? this._renderSourceEditor(t, l, u) : ""}
        </div>
      </div>
    `;
  }
  _renderExternalSourceComposer(t) {
    var h, g;
    const e = this._availableSourceAreas(), i = this._isSiblingAreaSourceScope(), n = ((h = this.location) == null ? void 0 : h.ha_area_id) || "", o = !!n, a = this._externalAreaId || "", r = a ? a === "__this_area__" ? n ? this._entitiesForArea(n) : [] : this._entitiesForArea(a) : [], c = this._externalEntityId || "", d = new Set(this._workingSources(t).map((m) => this._sourceKeyFromSource(m))), u = c ? this._defaultSignalKeyForEntity(c) : void 0, l = c ? this._sourceKey(c, u) : "", p = i ? "Sibling Area" : (g = this.location) != null && g.ha_area_id ? "Other Area" : "Source Area", f = i ? "Select sibling area..." : "Select area...";
    return _`
      <div class="external-composer">
        ${i ? _`<div class="runtime-note">Sibling areas on this floor are available, plus all compatible entities in this area.</div>` : ""}
        ${i && e.length === 0 ? _`
              <div class="policy-warning">
                No sibling HA-backed areas are available for cross-area sources.
              </div>
            ` : ""}
        <div class="editor-field">
          <label for="external-source-area">${p}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${a}
            @change=${(m) => {
      const v = m.target.value;
      this._externalAreaId = v, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">${f}</option>
            ${o ? _`<option value="__this_area__">This area (all compatible)</option>` : ""}
            ${i ? "" : _`<option value="__all__">Any area / unassigned</option>`}
            ${e.map((m) => _`<option value=${m.area_id}>${m.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${c}
            @change=${(m) => {
      this._externalEntityId = m.target.value, this.requestUpdate();
    }}
            ?disabled=${!a}
          >
            <option value="">Select sensor...</option>
            ${r.map((m) => _`
              <option
                value=${m}
                ?disabled=${d.has(this._sourceKey(m, this._defaultSignalKeyForEntity(m)))}
              >
                ${this._entityName(m)}${d.has(this._sourceKey(m, this._defaultSignalKeyForEntity(m))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !c || (l ? d.has(l) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(c, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(c)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderWiabSection(t) {
    var u, l, p, f;
    const e = this._getWiabConfig(t), i = this._wiabInteriorCandidates(), n = this._wiabDoorCandidates(), o = ((u = this.location) == null ? void 0 : u.ha_area_id) || "", a = o ? ((f = (p = (l = this.hass) == null ? void 0 : l.areas) == null ? void 0 : p[o]) == null ? void 0 : f.name) || o : "", r = !!o && !this._wiabShowAllEntities, c = e.preset || "off";
    return _`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:box-shadow"}></ha-icon>
          Wasp In A Box
        </div>
        <div class="subsection-help">
          Preset occupancy latch behavior for enclosed rooms and whole-home containment.
          Use this when boundary sensors should hold occupancy until a release event occurs.
        </div>

        <div class="wiab-config">
          <div class="editor-field" style="max-width: 420px;">
            <label for="wiab-preset">Preset</label>
            <select
              id="wiab-preset"
              data-testid="wiab-preset-select"
              .value=${c}
              @change=${(h) => {
      const g = this._normalizeWiabPreset(
        h.target.value
      ), m = this._defaultWiabTimeouts(g);
      this._updateConfig({
        ...t,
        wiab: {
          ...e,
          preset: g,
          hold_timeout_sec: m.hold_timeout_sec,
          release_timeout_sec: m.release_timeout_sec
        }
      });
    }}
            >
              <option value="off">Off</option>
              <option value="enclosed_room">Enclosed Room (Door Latch)</option>
              <option value="home_containment">Home Containment</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          ${c === "off" ? _`<div class="policy-note">WIAB is disabled for this location.</div>` : _`<div class="policy-note">Active preset: ${c === "enclosed_room" ? "Enclosed Room (Door Latch)" : c === "home_containment" ? "Home Containment" : c === "hybrid" ? "Hybrid" : "Off"}</div>`}

          ${c === "off" ? "" : _`
                ${o ? _`
                      <label class="editor-toggle">
                        <input
                          type="checkbox"
                          data-testid="wiab-show-all-toggle"
                          .checked=${this._wiabShowAllEntities}
                          @change=${(h) => {
      this._wiabShowAllEntities = h.target.checked;
    }}
                        />
                        Show entities from all areas
                      </label>
                      <div class="policy-note">
                        ${r ? `Showing ${a} entities by default.` : "Showing entities from all areas."}
                      </div>
                    ` : ""}

                ${this._renderWiabEntityEditor({
      label: "Interior entities",
      listKey: "interior_entities",
      candidates: i,
      selectedEntityId: this._wiabInteriorEntityId,
      setSelectedEntityId: (h) => {
        this._wiabInteriorEntityId = h;
      },
      config: t,
      testIdPrefix: "wiab-interior"
    })}

                ${c === "enclosed_room" || c === "hybrid" ? this._renderWiabEntityEditor({
      label: "Boundary door entities",
      listKey: "door_entities",
      candidates: n,
      selectedEntityId: this._wiabDoorEntityId,
      setSelectedEntityId: (h) => {
        this._wiabDoorEntityId = h;
      },
      config: t,
      testIdPrefix: "wiab-door"
    }) : ""}

                ${c === "home_containment" || c === "hybrid" ? this._renderWiabEntityEditor({
      label: "Exterior door entities",
      listKey: "exterior_door_entities",
      candidates: n,
      selectedEntityId: this._wiabExteriorDoorEntityId,
      setSelectedEntityId: (h) => {
        this._wiabExteriorDoorEntityId = h;
      },
      config: t,
      testIdPrefix: "wiab-exterior-door"
    }) : ""}

                <div class="wiab-grid">
                  <div class="editor-field">
                    <label for="wiab-hold-timeout">Hold timeout (sec)</label>
                    <input
                      id="wiab-hold-timeout"
                      data-testid="wiab-hold-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(e.hold_timeout_sec ?? 0)}
                      @change=${(h) => {
      const g = Number(h.target.value);
      this._updateWiabValue(t, "hold_timeout_sec", g);
    }}
                    />
                  </div>
                  <div class="editor-field">
                    <label for="wiab-release-timeout">Release timeout (sec)</label>
                    <input
                      id="wiab-release-timeout"
                      data-testid="wiab-release-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(e.release_timeout_sec ?? 0)}
                      @change=${(h) => {
      const g = Number(h.target.value);
      this._updateWiabValue(t, "release_timeout_sec", g);
    }}
                    />
                  </div>
                </div>
              `}
        </div>
      </div>
    `;
  }
  _renderWiabEntityEditor(t) {
    const i = this._getWiabConfig(t.config)[t.listKey] || [], n = new Set(i), o = t.candidates.filter((r) => !n.has(r)), a = n.has(t.selectedEntityId) ? "" : t.selectedEntityId;
    return _`
      <div class="wiab-entity-editor">
        <label>${t.label}</label>
        <div class="wiab-entity-input">
          <select
            data-testid=${`${t.testIdPrefix}-select`}
            .value=${a}
            @change=${(r) => {
      t.setSelectedEntityId(r.target.value), this.requestUpdate();
    }}
          >
            <option value="">Select entity...</option>
            ${o.map((r) => _`
              <option value=${r}>${this._entityName(r)} (${r})</option>
            `)}
          </select>
          <button
            class="button button-secondary"
            data-testid=${`${t.testIdPrefix}-add`}
            ?disabled=${!a}
            @click=${() => {
      this._addWiabEntity(t.config, t.listKey, a) && (t.setSelectedEntityId(""), this.requestUpdate());
    }}
          >
            Add
          </button>
        </div>

        ${i.length === 0 ? _`<div class="wiab-empty">No entities configured.</div>` : _`
              <div class="wiab-chip-list">
                ${i.map((r) => _`
                  <span class="wiab-chip" data-testid=${`${t.testIdPrefix}-chip`}>
                    ${this._entityName(r)}
                    <button
                      type="button"
                      aria-label="Remove entity"
                      data-testid=${`${t.testIdPrefix}-remove`}
                      @click=${() => this._removeWiabEntity(t.config, t.listKey, r)}
                    >
                      ×
                    </button>
                  </span>
                `)}
              </div>
            `}
      </div>
    `;
  }
  _getWiabConfig(t) {
    const e = t.wiab || {}, i = this._normalizeWiabPreset(e.preset), n = this._defaultWiabTimeouts(i);
    return {
      preset: i,
      interior_entities: this._normalizeWiabEntities(e.interior_entities),
      door_entities: this._normalizeWiabEntities(e.door_entities),
      exterior_door_entities: this._normalizeWiabEntities(e.exterior_door_entities),
      hold_timeout_sec: this._clampWiabSeconds(e.hold_timeout_sec, n.hold_timeout_sec),
      release_timeout_sec: this._clampWiabSeconds(e.release_timeout_sec, n.release_timeout_sec)
    };
  }
  _normalizeWiabPreset(t) {
    const e = String(t || "").trim().toLowerCase();
    return e === "enclosed_room" ? "enclosed_room" : e === "home_containment" ? "home_containment" : e === "hybrid" ? "hybrid" : "off";
  }
  _defaultWiabTimeouts(t) {
    return t === "home_containment" ? { hold_timeout_sec: 3600, release_timeout_sec: 120 } : t === "hybrid" ? { hold_timeout_sec: 1800, release_timeout_sec: 120 } : { hold_timeout_sec: 900, release_timeout_sec: 90 };
  }
  _normalizeWiabEntities(t) {
    if (!Array.isArray(t)) return [];
    const e = /* @__PURE__ */ new Set(), i = [];
    for (const n of t) {
      if (typeof n != "string") continue;
      const o = n.trim();
      !o || e.has(o) || (e.add(o), i.push(o));
    }
    return i;
  }
  _clampWiabSeconds(t, e) {
    const i = Number.parseInt(String(t ?? e), 10);
    return Number.isNaN(i) ? e : Math.max(0, Math.min(86400, i));
  }
  _updateWiabValue(t, e, i) {
    const n = this._getWiabConfig(t), o = n[e] ?? this._defaultWiabTimeouts(n.preset || "off")[e], a = this._clampWiabSeconds(i, o);
    this._updateConfig({
      ...t,
      wiab: {
        ...n,
        [e]: a
      }
    });
  }
  _addWiabEntity(t, e, i) {
    const n = i.trim();
    if (!n) return !1;
    const o = this._getWiabConfig(t), a = o[e] || [];
    return a.includes(n) ? !1 : (this._updateConfig({
      ...t,
      wiab: {
        ...o,
        [e]: [...a, n]
      }
    }), !0);
  }
  _removeWiabEntity(t, e, i) {
    const n = this._getWiabConfig(t), o = n[e] || [], a = o.filter((r) => r !== i);
    a.length !== o.length && this._updateConfig({
      ...t,
      wiab: {
        ...n,
        [e]: a
      }
    });
  }
  _wiabInteriorCandidates() {
    return this._wiabCandidates((t) => this._isCandidateEntity(t));
  }
  _wiabDoorCandidates() {
    return this._wiabCandidates((t) => this._isDoorBoundaryEntity(t));
  }
  _wiabCandidates(t) {
    var o, a;
    const e = ((o = this.hass) == null ? void 0 : o.states) || {}, i = (a = this.location) == null ? void 0 : a.ha_area_id;
    return (i && !this._wiabShowAllEntities ? this._wiabEntityIdsForArea(i) : Object.keys(e)).filter((r) => this._isCandidateEntity(r)).filter(t).sort((r, c) => this._entityName(r).localeCompare(this._entityName(c)));
  }
  _wiabEntityIdsForArea(t) {
    var n, o;
    const e = ((n = this.hass) == null ? void 0 : n.states) || {}, i = /* @__PURE__ */ new Set();
    for (const a of ((o = this.location) == null ? void 0 : o.entity_ids) || [])
      e[a] && i.add(a);
    for (const a of Object.keys(e))
      this._entityIsInArea(a, t) && i.add(a);
    return [...i];
  }
  _entityIsInArea(t, e) {
    var o, a, r;
    const i = ((o = this.hass) == null ? void 0 : o.states) || {}, n = this._entityAreaById[t];
    return n !== void 0 ? n === e : ((r = (a = i[t]) == null ? void 0 : a.attributes) == null ? void 0 : r.area_id) === e;
  }
  _isDoorBoundaryEntity(t) {
    var a, r, c;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory || t.split(".", 1)[0] !== "binary_sensor") return !1;
    const o = String(((c = e.attributes) == null ? void 0 : c.device_class) || "").toLowerCase();
    return ["door", "garage_door", "opening", "window"].includes(o);
  }
  _renderSourceEditor(t, e, i) {
    const n = e, o = this._eventLabelsForSource(e), a = this._sourceKeyFromSource(e), r = this._supportsOffBehavior(e), c = t.default_timeout || 300, d = this._onTimeoutMemory[a], u = n.on_timeout === null ? d ?? c : n.on_timeout ?? d ?? c, l = Math.max(1, Math.min(120, Math.round(u / 60))), p = n.off_trailing ?? 0, f = Math.max(0, Math.min(120, Math.round(p / 60)));
    return _`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? _`<div class="media-signals">Trigger signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${i}">${o.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(n.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(n, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${i}"
              .value=${n.on_event || "trigger"}
              @change=${(h) => {
      this._updateSourceDraft(t, i, {
        ...n,
        on_event: h.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${i}">${o.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${i}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(l)}
                ?disabled=${n.on_timeout === null}
                @input=${(h) => {
      const g = Number(h.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: g * 60
      }, this._updateSourceDraft(t, i, { ...n, on_timeout: g * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(l)}
                ?disabled=${n.on_timeout === null}
                @change=${(h) => {
      const g = Math.max(1, Math.min(120, Number(h.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: g * 60
      }, this._updateSourceDraft(t, i, { ...n, on_timeout: g * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${n.on_timeout === null}
                @change=${(h) => {
      const g = h.target.checked, m = this._onTimeoutMemory[a], v = l * 60, S = m ?? v;
      g && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: n.on_timeout ?? S
      }), this._updateSourceDraft(t, i, {
        ...n,
        on_timeout: g ? null : S
      });
    }}
              />
              Indefinite (until ${o.offState})
            </label>
          </div>

          ${r ? _`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${i}">${o.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(n, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${i}"
                    .value=${n.off_event || "none"}
                    @change=${(h) => {
      this._updateSourceDraft(t, i, {
        ...n,
        off_event: h.target.value
      });
    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${i}">${o.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${i}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(f)}
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @input=${(h) => {
      const g = Math.max(0, Math.min(120, Number(h.target.value) || 0));
      this._updateSourceDraft(t, i, { ...n, off_trailing: g * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(f)}
                      ?disabled=${(n.off_event || "none") !== "clear"}
                      @change=${(h) => {
      const g = Math.max(0, Math.min(120, Number(h.target.value) || 0));
      this._updateSourceDraft(t, i, { ...n, off_trailing: g * 60 });
    }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              ` : ""}
        </div>
      </div>
    `;
  }
  _normalizeActionTriggerType(t) {
    const e = String(t || "").trim().toLowerCase();
    return e === "on_occupied" ? "on_occupied" : e === "on_vacant" ? "on_vacant" : e === "occupied" ? "on_occupied" : e === "vacant" ? "on_vacant" : "on_occupied";
  }
  _defaultActionAmbientConditionForTrigger(t) {
    return "any";
  }
  _normalizeActionAmbientCondition(t, e) {
    const i = String(t || "").trim().toLowerCase();
    return i === "any" || i === "dark" || i === "bright" ? i : this._defaultActionAmbientConditionForTrigger(e);
  }
  _normalizeActionTime(t, e) {
    const i = String(t || "").trim();
    if (!i) return e;
    const n = i.split(":");
    if (n.length < 2) return e;
    const o = Number(n[0]), a = Number(n[1]);
    return !Number.isFinite(o) || !Number.isFinite(a) || o < 0 || o > 23 || a < 0 || a > 59 ? e : `${String(o).padStart(2, "0")}:${String(a).padStart(2, "0")}`;
  }
  _defaultActionServiceForTrigger(t, e) {
    const i = String(t || "").split(".", 1)[0];
    return i === "media_player" ? e === "on_vacant" ? "media_stop" : "media_play" : e === "on_vacant" ? "turn_off" : "turn_on";
  }
  _actionServiceOptionsForRule(t, e) {
    const i = String(t || "").trim();
    if (!i) return [];
    const n = i.split(".", 1)[0];
    if (n === "media_player")
      return [
        { value: "turn_on", label: "Power on" },
        { value: "turn_off", label: "Power off" },
        { value: "media_play", label: "Play" },
        { value: "media_play_pause", label: "Play/Pause" },
        { value: "media_pause", label: "Pause" },
        { value: "media_stop", label: "Stop" },
        { value: "volume_up", label: "Volume up" },
        { value: "volume_down", label: "Volume down" }
      ];
    if (n === "fan")
      return [
        { value: "turn_on", label: "Turn on" },
        { value: "turn_off", label: "Turn off" }
      ];
    if (n === "switch")
      return [
        { value: "turn_on", label: "Turn on" },
        { value: "turn_off", label: "Turn off" },
        { value: "toggle", label: "Toggle" }
      ];
    const o = this._defaultActionServiceForTrigger(i, e);
    return [
      { value: "turn_on", label: "Turn on" },
      { value: "turn_off", label: "Turn off" }
    ].sort((a, r) => a.value === o ? -1 : r.value === o ? 1 : 0);
  }
  _actionDomainsForTab(t) {
    return t === "appliances" ? ["switch"] : t === "media" ? ["media_player"] : ["fan"];
  }
  _tabForActionEntity(t) {
    const e = String(t || "").split(".", 1)[0];
    if (e === "switch") return "appliances";
    if (e === "media_player") return "media";
    if (e === "fan") return "hvac";
  }
  _isActionRuleEntity(t, e) {
    var o, a;
    if (!((a = (o = this.hass) == null ? void 0 : o.states) == null ? void 0 : a[t])) return !1;
    const n = t.split(".", 1)[0];
    return e ? this._actionDomainsForTab(e).includes(n) : n === "switch" || n === "media_player" || n === "fan";
  }
  _actionRuleTargetEntities(t) {
    if (!this.location) return [];
    const e = /* @__PURE__ */ new Set();
    for (const i of this.location.entity_ids || [])
      this._isActionRuleEntity(i, t) && e.add(i);
    if (this.location.ha_area_id)
      for (const i of this._entitiesForArea(this.location.ha_area_id))
        this._isActionRuleEntity(i, t) && e.add(i);
    return [...e].sort((i, n) => this._entityName(i).localeCompare(this._entityName(n)));
  }
  _normalizeActionRule(t, e) {
    const i = this._normalizeActionTriggerType(t.trigger_type), o = this._actionRuleTargetEntities()[0] || "", a = typeof t.action_entity_id == "string" && t.action_entity_id.trim().length > 0 ? t.action_entity_id : o, r = typeof t.action_service == "string" && t.action_service.trim().length > 0 ? t.action_service : this._defaultActionServiceForTrigger(a, i), c = typeof t.id == "string" && t.id.trim().length > 0 ? t.id : `action_rule_${e + 1}`;
    return {
      id: c,
      entity_id: typeof t.entity_id == "string" && t.entity_id.trim().length > 0 ? t.entity_id : `automation.${c}`,
      name: typeof t.name == "string" && t.name.trim().length > 0 ? t.name.trim() : `Rule ${e + 1}`,
      trigger_type: i,
      action_entity_id: a || void 0,
      action_service: r || void 0,
      ambient_condition: this._normalizeActionAmbientCondition(
        t.ambient_condition,
        i
      ),
      must_be_occupied: !!t.must_be_occupied,
      time_condition_enabled: !!t.time_condition_enabled,
      start_time: this._normalizeActionTime(t.start_time, "18:00"),
      end_time: this._normalizeActionTime(t.end_time, "23:59"),
      enabled: t.enabled !== !1,
      require_dark: this._normalizeActionAmbientCondition(t.ambient_condition, i) === "dark"
    };
  }
  _workingActionRules() {
    return (this._actionRulesDraft ?? this._actionRules).map((e, i) => this._normalizeActionRule(e, i));
  }
  _rulesForDeviceAutomationTab(t) {
    return this._workingActionRules().filter((i) => {
      const n = String(i.action_entity_id || "").trim();
      return n ? this._tabForActionEntity(n) === t : this._actionRuleTabById[String(i.id || "")] === t;
    });
  }
  _resetActionRulesDraftFromLoaded() {
    const t = this._actionRules.map(
      (e, i) => this._normalizeActionRule(e, i)
    );
    this._actionRulesDraft = t, this._actionRulesDraftDirty = !1, this._actionRulesSaveError = void 0, this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "", this._actionRuleTabById = {};
    for (const e of t) {
      const i = String(e.id || ""), n = this._tabForActionEntity(String(e.action_entity_id || "").trim());
      i && n && (this._actionRuleTabById[i] = n);
    }
  }
  _setActionRulesDraft(t) {
    const e = t.map((o, a) => this._normalizeActionRule(o, a)), i = new Set(e.map((o) => String(o.id || ""))), n = {};
    for (const [o, a] of Object.entries(this._actionRuleTabById))
      i.has(o) && (n[o] = a);
    for (const o of e) {
      const a = String(o.id || ""), r = this._tabForActionEntity(String(o.action_entity_id || "").trim());
      a && r && (n[a] = r);
    }
    this._actionRuleTabById = n, this._actionRulesDraft = e, this._actionRulesDraftDirty = !0, this._actionRulesSaveError = void 0, this.requestUpdate();
  }
  _addActionRule(t) {
    const e = this._workingActionRules(), n = this._actionRuleTargetEntities(t)[0] || "", o = this._normalizeActionRule(
      {
        id: `action_rule_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
        entity_id: "",
        name: `Rule ${e.length + 1}`,
        trigger_type: "on_occupied",
        action_entity_id: n,
        action_service: this._defaultActionServiceForTrigger(n, "on_occupied"),
        ambient_condition: "any",
        must_be_occupied: !1,
        time_condition_enabled: !1,
        start_time: "18:00",
        end_time: "23:59",
        enabled: !0
      },
      e.length
    );
    this._actionRuleTabById[String(o.id || "")] = t, this._setActionRulesDraft([...e, o]);
  }
  _updateActionRule(t, e) {
    const i = this._workingActionRules().map((n, o) => {
      if (n.id !== t) return this._normalizeActionRule(n, o);
      const a = {
        ...n,
        ...e
      };
      if (Object.prototype.hasOwnProperty.call(e, "trigger_type")) {
        const r = this._normalizeActionTriggerType(e.trigger_type);
        a.trigger_type = r, Object.prototype.hasOwnProperty.call(e, "ambient_condition") || (a.ambient_condition = this._defaultActionAmbientConditionForTrigger(r)), !Object.prototype.hasOwnProperty.call(e, "action_service") && typeof a.action_entity_id == "string" && a.action_entity_id && (a.action_service = this._defaultActionServiceForTrigger(
          a.action_entity_id,
          r
        ));
      }
      if (Object.prototype.hasOwnProperty.call(e, "action_entity_id")) {
        const r = String(e.action_entity_id || "").trim();
        a.action_entity_id = r || void 0, r && !Object.prototype.hasOwnProperty.call(e, "action_service") && (a.action_service = this._defaultActionServiceForTrigger(
          r,
          this._normalizeActionTriggerType(a.trigger_type)
        ));
      }
      return this._normalizeActionRule(a, o);
    });
    this._setActionRulesDraft(i);
  }
  _removeActionRule(t) {
    const e = this._workingActionRules().filter((i) => i.id !== t);
    this._setActionRulesDraft(e);
  }
  _startActionRuleNameEdit(t, e) {
    this._editingActionRuleNameId = t, this._editingActionRuleNameValue = e, this.requestUpdate();
  }
  _cancelActionRuleNameEdit() {
    this._editingActionRuleNameId = void 0, this._editingActionRuleNameValue = "";
  }
  _commitActionRuleNameEdit(t, e) {
    const i = this._editingActionRuleNameValue.trim() || e;
    this._cancelActionRuleNameEdit(), this._updateActionRule(t, { name: i });
  }
  _actionRuleValidationErrors(t) {
    const e = [], i = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return t.forEach((n, o) => {
      var r;
      const a = ((r = n.name) == null ? void 0 : r.trim()) || `Rule ${o + 1}`;
      n.action_entity_id || e.push(`${a}: select a target device.`), n.action_service || e.push(`${a}: select an action service.`), n.time_condition_enabled && (i.test(String(n.start_time || "")) || e.push(`${a}: begin time must be HH:MM.`), i.test(String(n.end_time || "")) || e.push(`${a}: end time must be HH:MM.`));
    }), e;
  }
  async _saveActionRulesDraft() {
    if (!this.location || !this.hass || this._savingActionRules) return;
    const t = this._workingActionRules(), e = this._actionRuleValidationErrors(t);
    if (e.length > 0) {
      this._actionRulesSaveError = e[0], this.requestUpdate();
      return;
    }
    this._savingActionRules = !0, this._actionRulesSaveError = void 0, this.requestUpdate();
    try {
      const i = [...this._actionRules];
      i.length > 0 && await Promise.all(
        i.map(
          (o) => aa(this.hass, o, this.entryId)
        )
      );
      const n = [];
      for (const [o, a] of t.entries()) {
        if (!a.action_entity_id || !a.action_service) continue;
        const r = this._normalizeActionRule(a, o), c = await oa(
          this.hass,
          {
            location: this.location,
            name: r.name || `Rule ${o + 1}`,
            trigger_type: r.trigger_type,
            action_entity_id: r.action_entity_id,
            action_service: r.action_service,
            ambient_condition: r.ambient_condition,
            must_be_occupied: !!r.must_be_occupied,
            time_condition_enabled: !!r.time_condition_enabled,
            start_time: r.start_time,
            end_time: r.end_time,
            require_dark: r.ambient_condition === "dark"
          },
          this.entryId
        );
        n.push(c);
      }
      this._actionRules = n, this._resetActionRulesDraftFromLoaded(), this._showToast("Action rules saved", "success");
    } catch (i) {
      this._actionRulesSaveError = (i == null ? void 0 : i.message) || "Failed to save action rules", this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = !1, this.requestUpdate();
    }
  }
  _resetActionRulesDraft() {
    this._resetActionRulesDraftFromLoaded(), this._showToast("Action rule changes reverted", "success");
  }
  _deviceAutomationTabMeta(t) {
    return t === "appliances" ? {
      icon: "mdi:power-plug",
      label: "Appliance Rules",
      emptyMessage: "No appliance rules configured yet."
    } : t === "media" ? {
      icon: "mdi:speaker-wireless",
      label: "Media Rules",
      emptyMessage: "No media rules configured yet."
    } : {
      icon: "mdi:fan",
      label: "HVAC Rules",
      emptyMessage: "No HVAC rules configured yet."
    };
  }
  _renderDeviceAutomationTab(t) {
    if (!this.location) return "";
    const e = this._savingActionRules || this._loadingActionRules, i = this._deviceAutomationTabMeta(t), n = this._rulesForDeviceAutomationTab(t), o = this._actionRuleValidationErrors(n), a = this._actionRulesDraftDirty, r = this._actionRuleTargetEntities(t);
    return _`
      ${this._renderActionStartupConfig(t)}
      <div class="card-section" data-testid="actions-rules-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${i.icon}></ha-icon>
            ${i.label}
          </div>
          <div class="section-title-actions">
            <button
              class="dusk-save-button ${a ? "dirty" : ""}"
              type="button"
              data-testid="actions-rules-save"
              ?disabled=${e || !a}
              @click=${() => this._saveActionRulesDraft()}
            >
              Save changes
            </button>
          </div>
        </div>
        ${this._actionRulesError ? _`<div class="policy-warning">${this._actionRulesError}</div>` : ""}
        ${this._actionRulesSaveError ? _`<div class="policy-warning">${this._actionRulesSaveError}</div>` : ""}
        ${o.map((c) => _`<div class="policy-warning">${c}</div>`)}

        <div class="dusk-block-list">
          ${n.length === 0 ? _`
                <div class="text-muted">
                  ${i.emptyMessage}
                  ${r.length === 0 ? _`No compatible ${t} devices found in this location.` : ""}
                </div>
              ` : n.map((c, d) => {
      var f;
      const u = this._editingActionRuleNameId === String(c.id || ""), l = ((f = c.name) == null ? void 0 : f.trim()) || `Rule ${d + 1}`, p = this._actionServiceOptionsForRule(
        c.action_entity_id || "",
        c.trigger_type
      );
      return _`
                  <div class="dusk-block-row" data-testid=${`action-rule-${c.id}`}>
                    <div class="dusk-block-head">
                      ${u ? _`
                            <input
                              type="text"
                              class="input dusk-block-title-input"
                              .value=${this._editingActionRuleNameValue}
                              ?disabled=${e}
                              @input=${(h) => {
        this._editingActionRuleNameValue = h.target.value;
      }}
                              @blur=${() => this._commitActionRuleNameEdit(
        String(c.id || ""),
        `Rule ${d + 1}`
      )}
                              @keydown=${(h) => {
        h.key === "Enter" ? this._commitActionRuleNameEdit(
          String(c.id || ""),
          `Rule ${d + 1}`
        ) : h.key === "Escape" && this._cancelActionRuleNameEdit();
      }}
                            />
                          ` : _`
                            <button
                              type="button"
                              class="dusk-block-title-button"
                              ?disabled=${e}
                              @click=${() => this._startActionRuleNameEdit(
        String(c.id || ""),
        l
      )}
                            >
                              ${l}
                            </button>
                          `}
                    </div>

                    <div class="dusk-rule-row">
                      <span class="config-label">Trigger</span>
                      <select
                        class="dusk-wide-select"
                        .value=${c.trigger_type}
                        ?disabled=${e}
                        @change=${(h) => this._updateActionRule(String(c.id || ""), {
        trigger_type: this._normalizeActionTriggerType(
          h.target.value
        )
      })}
                      >
                        <option value="on_occupied">On occupied</option>
                        <option value="on_vacant">On vacant</option>
                      </select>
                    </div>

                    <div class="dusk-rule-section-title">Conditions</div>
                    <div class="dusk-conditions">
                      <div class="config-row">
                        <div>
                          <div class="config-label">Ambient must be</div>
                          <div class="config-help">
                            Optional ambient filter at trigger time.
                          </div>
                        </div>
                        <div class="config-value">
                          <select
                            class="dusk-wide-select"
                            .value=${c.ambient_condition || this._defaultActionAmbientConditionForTrigger(c.trigger_type)}
                            ?disabled=${e}
                            @change=${(h) => this._updateActionRule(String(c.id || ""), {
        ambient_condition: this._normalizeActionAmbientCondition(
          h.target.value,
          c.trigger_type
        )
      })}
                          >
                            <option value="any">Ignore ambient</option>
                            <option value="dark">Must be dark</option>
                            <option value="bright">Must be bright</option>
                          </select>
                        </div>
                      </div>

                      <div class="config-row">
                        <div>
                          <div class="config-label">Must be occupied</div>
                          <div class="config-help">
                            Apply this rule only when the location is occupied at trigger time.
                          </div>
                        </div>
                        <div class="config-value">
                          <input
                            type="checkbox"
                            class="switch-input"
                            .checked=${!!c.must_be_occupied}
                            ?disabled=${e}
                            @change=${(h) => this._updateActionRule(String(c.id || ""), {
        must_be_occupied: h.target.checked
      })}
                          />
                        </div>
                      </div>

                      <div class="config-row">
                        <div>
                          <div class="config-label">Use time window</div>
                          <div class="config-help">
                            Limit this rule to a time range. Crossing midnight is supported.
                          </div>
                        </div>
                        <div class="config-value">
                          <input
                            type="checkbox"
                            class="switch-input"
                            .checked=${!!c.time_condition_enabled}
                            ?disabled=${e}
                            @change=${(h) => this._updateActionRule(String(c.id || ""), {
        time_condition_enabled: h.target.checked
      })}
                          />
                        </div>
                      </div>

                      ${c.time_condition_enabled ? _`
                            <div class="dusk-time-fields" style="margin-top: 8px;">
                              <label class="dusk-time-field">
                                <span class="config-label">Begin</span>
                                <input
                                  type="time"
                                  class="input"
                                  .value=${String(c.start_time || "18:00")}
                                  ?disabled=${e}
                                  @change=${(h) => this._updateActionRule(String(c.id || ""), {
        start_time: this._normalizeActionTime(
          h.target.value,
          "18:00"
        )
      })}
                                />
                              </label>
                              <label class="dusk-time-field">
                                <span class="config-label">End</span>
                                <input
                                  type="time"
                                  class="input"
                                  .value=${String(c.end_time || "23:59")}
                                  ?disabled=${e}
                                  @change=${(h) => this._updateActionRule(String(c.id || ""), {
        end_time: this._normalizeActionTime(
          h.target.value,
          "23:59"
        )
      })}
                                />
                              </label>
                            </div>
                          ` : ""}
                    </div>

                    <div class="dusk-rule-section-title">Actions</div>
                    <div class="dusk-rule-row">
                      <span class="config-label">Device</span>
                      <select
                        class="dusk-wide-select"
                        .value=${c.action_entity_id || ""}
                        ?disabled=${e}
                        @change=${(h) => this._updateActionRule(String(c.id || ""), {
        action_entity_id: h.target.value
      })}
                      >
                        <option value="">Select device...</option>
                        ${r.map((h) => _`
                          <option value=${h}>
                            ${this._entityName(h)} (${h})
                          </option>
                        `)}
                      </select>
                    </div>
                    <div class="dusk-rule-row">
                      <span class="config-label">Action</span>
                      <select
                        class="dusk-wide-select"
                        .value=${c.action_service || ""}
                        ?disabled=${e || !c.action_entity_id}
                        @change=${(h) => this._updateActionRule(String(c.id || ""), {
        action_service: h.target.value
      })}
                      >
                        ${c.action_entity_id ? p.map(
        (h) => _`<option value=${h.value}>${h.label}</option>`
      ) : _`<option value="">Select device first...</option>`}
                      </select>
                    </div>
                    <div class="dusk-block-footer">
                      <button
                        class="button button-primary dusk-delete-rule-button"
                        type="button"
                        data-testid=${`action-rule-${c.id}-delete`}
                        ?disabled=${e}
                        @click=${() => this._removeActionRule(String(c.id || ""))}
                      >
                        Delete rule
                      </button>
                    </div>
                  </div>
                `;
    })}
        </div>

        <div class="dusk-list-footer">
          <button
            class="button button-primary"
            data-testid="action-rule-add"
            ?disabled=${e}
            @click=${() => this._addActionRule(t)}
          >
            Add rule
          </button>
        </div>
      </div>
    `;
  }
  _renderActionStartupConfig(t) {
    const e = this._getAutomationConfig(), i = !!e.reapply_last_state_on_startup, n = t === "lighting" ? "lighting" : t === "appliances" ? "appliance" : t === "media" ? "media" : "HVAC", o = t === "lighting" ? "Reapply lighting rules on startup" : t === "appliances" ? "Reapply appliance rules on startup" : t === "media" ? "Reapply media rules on startup" : "Reapply HVAC rules on startup";
    return _`
      <div class="startup-inline">
        <label class="startup-inline-toggle">
          <input
            type="checkbox"
            class="switch-input"
            .checked=${i}
            data-testid=${`startup-reapply-${t}`}
            @change=${(a) => {
      const r = a.target.checked;
      this._updateAutomationConfig({
        ...e,
        reapply_last_state_on_startup: r
      });
    }}
          />
          ${o}
        </label>
        <div class="startup-inline-help">
          Re-runs matching ${n} rules for this location after Home Assistant starts.
        </div>
      </div>
    `;
  }
  _workingSources(t) {
    return this._stagedSources ? [...this._stagedSources] : [...t.occupancy_sources || []];
  }
  _setWorkingSources(t) {
    const e = t.map((n) => this._normalizeSource(n.entity_id, n)), i = { ...this._onTimeoutMemory };
    for (const n of e)
      typeof n.on_timeout == "number" && n.on_timeout > 0 && (i[this._sourceKeyFromSource(n)] = n.on_timeout);
    this._onTimeoutMemory = i, this._stagedSources = e, this._scheduleSourcePersist(), this.requestUpdate();
  }
  _updateSourceDraft(t, e, i) {
    const n = this._workingSources(t), o = n[e];
    if (!o) return;
    const a = this._modeOptionsForEntity(o.entity_id).map((c) => c.value), r = this._normalizeSource(
      o.entity_id,
      {
        ...i,
        mode: a.includes(i.mode) ? i.mode : a[0]
      }
    );
    n[e] = r, this._setWorkingSources(n);
  }
  _removeSource(t, e) {
    const i = this._workingSources(e), n = i[t];
    if (!n) return;
    i.splice(t, 1);
    const o = { ...this._onTimeoutMemory };
    delete o[this._sourceKeyFromSource(n)], this._onTimeoutMemory = o, this._setWorkingSources(i);
  }
  _removeSourcesByKey(t, e) {
    if (!t.length) return;
    const i = new Set(t), n = this._workingSources(e), o = n.filter((r) => !i.has(this._sourceKeyFromSource(r)));
    if (o.length === n.length) return;
    const a = { ...this._onTimeoutMemory };
    for (const r of n) {
      const c = this._sourceKeyFromSource(r);
      i.has(c) && delete a[c];
    }
    this._onTimeoutMemory = a, this._setWorkingSources(o);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location) return !1;
    if (this._isFloorLocation())
      return this._showToast("Floor locations do not support occupancy sources.", "error"), !1;
    const n = this._workingSources(e), o = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (n.some((u) => this._sourceKeyFromSource(u) === o))
      return !1;
    const a = this.hass.states[t];
    if (!a)
      return this._showToast(`Entity not found: ${t}`, "error"), !1;
    let c = wn(a);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? c = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (c = this._lightSignalDefaults(t, i.signalKey));
    const d = this._normalizeSource(t, c);
    return this._setWorkingSources([...n, d]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate()), !0;
  }
  _resetSourceDraftState() {
    this._sourcePersistTimer && (window.clearTimeout(this._sourcePersistTimer), this._sourcePersistTimer = void 0), this._sourcePersistQueued = !1, this._stagedSources = void 0;
  }
  _scheduleSourcePersist(t = 250) {
    this._sourcePersistTimer && (window.clearTimeout(this._sourcePersistTimer), this._sourcePersistTimer = void 0), this._sourcePersistTimer = window.setTimeout(() => {
      this._sourcePersistTimer = void 0, this._flushSourcePersist();
    }, t);
  }
  async _flushSourcePersist() {
    var e;
    if (!this.location || !this._stagedSources) return;
    if (this._sourcePersistInFlight) {
      this._sourcePersistQueued = !0;
      return;
    }
    const t = this._stagedSources.map((i) => ({ ...i }));
    this._sourcePersistInFlight = !0, this._savingSource = !0, this.requestUpdate();
    try {
      await this._persistOccupancySources(t), this._sourcesEqual(this._stagedSources, t) && (this._stagedSources = void 0);
    } catch (i) {
      console.error("Failed to persist occupancy source changes", {
        locationId: (e = this.location) == null ? void 0 : e.id,
        error: i
      }), this._showToast((i == null ? void 0 : i.message) || "Failed to save source changes", "error");
    } finally {
      this._sourcePersistInFlight = !1, this._savingSource = !1, this.requestUpdate(), this._sourcePersistQueued && (this._sourcePersistQueued = !1, this._flushSourcePersist());
    }
  }
  _sourcesEqual(t, e) {
    return !t || t.length !== e.length ? !1 : t.every((i, n) => JSON.stringify(i) === JSON.stringify(e[n]));
  }
  async _persistOccupancySources(t) {
    if (!this.location) return;
    const e = this._getOccupancyConfig();
    await this._updateConfig({
      ...e,
      occupancy_sources: t
    });
  }
  _normalizeSource(t, e) {
    var l;
    const i = this._isMediaEntity(t), n = this._isDimmableEntity(t), o = this._isColorCapableEntity(t), a = (l = e.source_id) != null && l.includes("::") ? e.source_id.split("::")[1] : void 0, r = this._defaultSignalKeyForEntity(t), c = e.signal_key || a || r;
    let d;
    (i && (c === "playback" || c === "volume" || c === "mute") || (n || o) && (c === "power" || c === "level" || c === "color")) && (d = c);
    const u = e.source_id || this._sourceKey(t, d);
    return {
      entity_id: t,
      source_id: u,
      signal_key: d,
      mode: e.mode || "any_change",
      on_event: e.on_event || "trigger",
      on_timeout: e.on_timeout,
      off_event: e.off_event || "none",
      off_trailing: e.off_trailing ?? 0
    };
  }
  _getOccupancyConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.occupancy) || {};
  }
  _getAutomationConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.automation) || {};
  }
  async _updateAutomationConfig(t) {
    await this._updateModuleConfig("automation", t);
  }
  _availableSourceAreas() {
    var o, a;
    if (this._isSiblingAreaSourceScope())
      return this._siblingSourceAreas();
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = this._managedShadowAreaIdSet(), i = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(i).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).filter((r) => !e.has(r.area_id)).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, c) => r.name.localeCompare(c.name));
  }
  _isSiblingAreaSourceScope() {
    if (!this.location || U(this.location) !== "area" || !this.location.ha_area_id) return !1;
    const t = this.allLocations || [];
    if (t.length === 0) return !1;
    const e = this.location.parent_id ?? null;
    if (!e) return !1;
    const i = t.find((n) => n.id === e);
    return !!i && U(i) === "floor";
  }
  _siblingSourceAreas() {
    if (!this.location || !this._isSiblingAreaSourceScope()) return [];
    const t = this.location.parent_id ?? null;
    if (!t) return [];
    const e = this.location.id, i = /* @__PURE__ */ new Set(), n = this._managedShadowLocationIds();
    return (this.allLocations || []).filter((o) => o.id !== e).filter((o) => (o.parent_id ?? null) === t).filter((o) => U(o) === "area").filter((o) => !this._isManagedShadowLocation(o, n)).filter((o) => !!o.ha_area_id).filter((o) => {
      const a = o.ha_area_id;
      return i.has(a) ? !1 : (i.add(a), !0);
    }).map((o) => ({
      area_id: o.ha_area_id,
      name: o.name || o.ha_area_id
    })).sort((o, a) => o.name.localeCompare(a.name));
  }
  _managedShadowAreaIdSet() {
    const t = /* @__PURE__ */ new Set(), e = this._managedShadowLocationIds();
    for (const i of this.allLocations || [])
      this._isManagedShadowLocation(i, e) && i.ha_area_id && t.add(i.ha_area_id);
    return t;
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((n) => this._isCandidateEntity(n)).sort((n, o) => this._entityName(n).localeCompare(this._entityName(o))) : Object.keys(e).filter((n) => {
      var a, r;
      const o = this._entityAreaById[n];
      return o != null ? o === t : ((r = (a = e[n]) == null ? void 0 : a.attributes) == null ? void 0 : r.area_id) === t;
    }).filter((n) => this._isCandidateEntity(n)).sort((n, o) => this._entityName(n).localeCompare(this._entityName(o)));
  }
  _isCandidateEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const n = e.attributes || {};
    if (this._isTopomationOccupancyOutput(n)) return !1;
    const o = t.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player"].includes(o))
      return !0;
    if (o === "binary_sensor") {
      const c = String(n.device_class || "");
      return c ? [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound"
      ].includes(c) : !0;
    }
    return !1;
  }
  _isCoreAreaSourceEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const n = e.attributes || {};
    if (this._isTopomationOccupancyOutput(n)) return !1;
    const o = t.split(".", 1)[0];
    if (o === "light" || o === "fan" || o === "media_player")
      return !0;
    if (o === "switch")
      return this._isLightClassifiedSwitch(n);
    if (o === "binary_sensor") {
      const c = String(n.device_class || "");
      return c ? [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound"
      ].includes(c) : !0;
    }
    return !1;
  }
  _isLightClassifiedSwitch(t) {
    return String(t.device_class || "").toLowerCase() === "light";
  }
  _isTopomationOccupancyOutput(t) {
    if (t.device_class !== "occupancy") return !1;
    const e = t.location_id;
    return typeof e == "string" && e.trim().length > 0;
  }
  _getOccupancyState() {
    var n;
    if (!this.location) return;
    const t = this.location.id, e = this._liveOccupancyStateByLocation[t];
    if (e)
      return e;
    const i = ((n = this.hass) == null ? void 0 : n.states) || {};
    for (const o of Object.values(i)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if (a.device_class === "occupancy" && a.location_id === this.location.id)
        return o;
    }
  }
  _resolveOccupiedState(t) {
    var n, o;
    const e = (n = this.location) == null ? void 0 : n.id, i = e ? (o = this.occupancyStates) == null ? void 0 : o[e] : void 0;
    if (typeof i == "boolean")
      return i;
    if (t) {
      if (t.state === "on")
        return !0;
      if (t.state === "off")
        return !1;
    }
  }
  _activeContributorsExcluding(t) {
    const e = this._getOccupancyState();
    if (((e == null ? void 0 : e.state) || "").toLowerCase() !== "on") return [];
    const i = (e == null ? void 0 : e.attributes) || {}, n = Array.isArray(i.contributions) ? i.contributions : [];
    if (!n.length) return [];
    const o = String(t || "").trim(), a = n.map((r) => String((r == null ? void 0 : r.source_id) || "").trim()).filter((r) => r.length > 0 && r !== o);
    return Array.from(new Set(a));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, n = e.lock_modes, o = e.direct_locks, a = Array.isArray(i) ? i.map((d) => String(d)) : [], r = Array.isArray(n) ? n.map((d) => String(d)) : [], c = Array.isArray(o) ? o.map((d) => ({
      sourceId: String((d == null ? void 0 : d.source_id) || "unknown"),
      mode: String((d == null ? void 0 : d.mode) || "freeze"),
      scope: String((d == null ? void 0 : d.scope) || "self")
    })).sort(
      (d, u) => `${d.sourceId}:${d.mode}:${d.scope}`.localeCompare(`${u.sourceId}:${u.mode}:${u.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: a,
      lockModes: r,
      directLocks: c
    };
  }
  _resolveVacantAt(t, e) {
    if (!e) return;
    const i = this._parseDateValue(t.vacant_at) || this._parseDateValue(t.effective_timeout_at);
    if (i)
      return i;
    const n = Array.isArray(t.contributions) ? t.contributions : [];
    if (!n.length)
      return;
    let o = !1, a;
    for (const r of n) {
      const c = r == null ? void 0 : r.expires_at;
      if (c == null) {
        o = !0;
        continue;
      }
      const d = this._parseDateValue(c);
      d && (!a || d.getTime() > a.getTime()) && (a = d);
    }
    return o ? null : a;
  }
  _formatVacantAtLabel(t) {
    return t instanceof Date ? this._formatDateTime(t) : "No timeout scheduled";
  }
  _resolveVacancyReason(t, e) {
    var a, r, c, d, u, l;
    if (e !== !1) return;
    const i = (a = this.location) == null ? void 0 : a.id;
    if (!i) return;
    const n = (c = (r = this.occupancyTransitions) == null ? void 0 : r[i]) == null ? void 0 : c.reason;
    if (((u = (d = this.occupancyTransitions) == null ? void 0 : d[i]) == null ? void 0 : u.occupied) === !1) {
      const p = this._formatOccupancyReason(n);
      if (p) return p;
    }
    return this._formatOccupancyReason((l = t == null ? void 0 : t.attributes) == null ? void 0 : l.reason);
  }
  _resolveOccupiedReason(t, e) {
    var d, u, l, p, f, h;
    if (e !== !0) return;
    const i = (d = this.location) == null ? void 0 : d.id;
    if (!i) return;
    const n = (l = (u = this.occupancyTransitions) == null ? void 0 : u[i]) == null ? void 0 : l.reason;
    if (((f = (p = this.occupancyTransitions) == null ? void 0 : p[i]) == null ? void 0 : f.occupied) === !0) {
      const g = this._formatOccupancyReason(n);
      if (g) return g;
    }
    const a = this._formatOccupancyReason((h = t == null ? void 0 : t.attributes) == null ? void 0 : h.reason);
    if (a) return a;
    const r = this._occupancyContributions(this._getOccupancyConfig(), !0);
    return r.length ? `Contributed by ${r[0].sourceLabel}` : "Active source events detected";
  }
  _formatOccupancyReason(t) {
    if (typeof t != "string") return;
    const e = t.trim();
    if (!e) return;
    const i = e.toLowerCase();
    if (i === "timeout")
      return "Vacated by timeout";
    if (i === "propagation:parent")
      return "Vacated by parent propagation";
    if (i.startsWith("propagation:child:"))
      return "Vacated by child propagation";
    if (i.startsWith("event:")) {
      const n = i.split(":", 2)[1];
      if (n === "clear") return "Vacated by clear event";
      if (n === "vacate") return "Vacated explicitly";
      if (n) return this._formatOccupancyEventReason(n, "vacancy");
    }
    if (i.startsWith("occupancy:")) {
      const n = i.split(":", 2)[1];
      if (n) return this._formatOccupancyEventReason(n, "occupied");
    }
    return `Reason: ${e}`;
  }
  _formatOccupancyEventReason(t, e) {
    const n = {
      occupied: "Occupied by",
      vacancy: "Vacated by"
    }[e];
    return t === "handoff" ? `${n} room handoff` : t === "trigger" ? `${n} trigger` : t === "inherit" ? `${n} inherited state` : `${n} ${t} event`;
  }
  _occupancyContributions(t, e = !1) {
    const i = this._getOccupancyState();
    if (!i) return [];
    const n = i.attributes || {}, o = Array.isArray(n.contributions) ? n.contributions : [], a = this._nowEpochMs, c = [...o.map((u) => {
      const l = typeof (u == null ? void 0 : u.source_id) == "string" && u.source_id ? u.source_id : typeof (u == null ? void 0 : u.source) == "string" && u.source ? u.source : "";
      if (!l) return;
      const p = this._sourceLabelForSourceId(t, l), f = String((u == null ? void 0 : u.state) || (u == null ? void 0 : u.state_value) || "").trim() || "active", h = this._parseDateValue(u == null ? void 0 : u.updated_at) || this._parseDateValue(u == null ? void 0 : u.changed_at) || this._parseDateValue(u == null ? void 0 : u.last_changed) || this._parseDateValue(u == null ? void 0 : u.timestamp), g = h ? `${this._formatRelativeDuration(h)} ago` : this._isContributionActive(u) ? "active" : "inactive";
      return {
        sourceLabel: p,
        sourceId: l,
        stateLabel: f,
        relativeTime: g,
        _timestampMs: h ? h.getTime() : a + (f === "active" ? 0 : -1),
        _active: this._isContributionActive(u)
      };
    }).filter(
      (u) => !!u
    )].sort((u, l) => u._active !== l._active ? u._active ? -1 : 1 : l._timestampMs - u._timestampMs);
    return (e ? c.filter((u) => u._active) : c).map(({ sourceLabel: u, stateLabel: l, relativeTime: p, sourceId: f }) => ({
      sourceLabel: `${u}${u === f ? "" : ` (${f})`}`,
      sourceId: f,
      stateLabel: l,
      relativeTime: p
    }));
  }
  _isContributionActive(t) {
    if (!t) return !1;
    const e = String(t.state || t.value || "").toLowerCase();
    if (e === "on" || e === "active" || e === "occupied" || e === "trigger")
      return !0;
    const i = this._parseDateValue(t.expires_at);
    return i ? i.getTime() > this._nowEpochMs : !1;
  }
  _sourceLabelForSourceId(t, e) {
    const i = (t.occupancy_sources || []).find(
      (n) => n.source_id === e || n.entity_id === e
    );
    if (i)
      return this._candidateTitle(
        i.entity_id,
        i.signal_key || this._normalizedSignalKey(i.entity_id, void 0)
      );
    if (e.includes("::")) {
      const [n, o] = e.split("::"), a = this._normalizedSignalKey(n, o), r = (t.occupancy_sources || []).find(
        (c) => c.entity_id === n
      );
      return r ? this._candidateTitle(r.entity_id, r.signal_key || a) : this._candidateTitle(n, a);
    }
    return this._entityName(e);
  }
  _parseDateValue(t) {
    if (t instanceof Date && !Number.isNaN(t.getTime()))
      return t;
    if (typeof t == "number" && Number.isFinite(t)) {
      const i = t > 1e12 ? t : t * 1e3, n = new Date(i);
      return Number.isNaN(n.getTime()) ? void 0 : n;
    }
    if (typeof t != "string" || !t) return;
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? void 0 : e;
  }
  _formatDateTime(t) {
    return new Intl.DateTimeFormat(void 0, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(t);
  }
  _formatRelativeDuration(t) {
    const e = Math.max(0, Math.floor((t.getTime() - this._nowEpochMs) / 1e3));
    if (e <= 0) return "now";
    const i = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), o = Math.floor(e % 3600 / 60), a = e % 60, r = [];
    return i > 0 && r.push(`${i}d`), n > 0 && r.push(`${n}h`), o > 0 && r.length < 2 && r.push(`${o}m`), (r.length === 0 || i === 0 && n === 0 && o === 0) && r.push(`${a}s`), r.slice(0, 2).join(" ");
  }
  _lockModeLabel(t) {
    return t === "block_occupied" ? "Block occupied" : t === "block_vacant" ? "Block vacant" : "Freeze";
  }
  _lockScopeLabel(t) {
    return t === "subtree" ? "Subtree" : "Self";
  }
  _startClockTicker() {
    this._clockTimer === void 0 && (this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1e3));
  }
  _stopClockTicker() {
    this._clockTimer !== void 0 && (window.clearInterval(this._clockTimer), this._clockTimer = void 0);
  }
  _describeSource(t, e) {
    const i = t.mode === "any_change" ? "Any change" : "Specific states", n = t.on_timeout === null ? null : t.on_timeout ?? e, o = t.off_trailing ?? 0, a = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(n)})` : "ON: ignore", r = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(o)})` : "OFF: ignore";
    return `${i} • ${a} • ${r}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], n = t.on_timeout === null ? null : t.on_timeout ?? e, o = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(_`<span class="event-chip">ON -> trigger (${this._formatDuration(n)})</span>`) : i.push(_`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      _`<span class="event-chip off">OFF -> clear (${this._formatDuration(o)})</span>`
    ) : i.push(_`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t], i = (e == null ? void 0 : e.attributes) || {}, n = t.split(".", 1)[0], o = String(i.device_class || "");
    return n === "person" || n === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : n === "binary_sensor" ? [
      "door",
      "garage_door",
      "opening",
      "window",
      "motion",
      "presence",
      "occupancy",
      "vibration",
      "sound"
    ].includes(o) ? [{ value: "specific_states", label: "Specific states" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ] : ["light", "switch", "fan", "media_player"].includes(n) ? [{ value: "any_change", label: "Any change" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ];
  }
  _supportsOffBehavior(t) {
    const e = t.entity_id.split(".", 1)[0];
    return !(e === "media_player" && (t.signal_key === "volume" || t.signal_key === "mute") || e === "light" && (t.signal_key === "level" || t.signal_key === "color"));
  }
  _eventLabelsForSource(t) {
    var d, u;
    const e = t.entity_id, i = (u = (d = this.hass) == null ? void 0 : d.states) == null ? void 0 : u[e], n = (i == null ? void 0 : i.attributes) || {}, o = e.split(".", 1)[0], a = String(n.device_class || "");
    let r = "ON", c = "OFF";
    return o === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(a) ? (r = "Open", c = "Closed") : o === "binary_sensor" && a === "motion" ? (r = "Motion", c = "No motion") : o === "binary_sensor" && ["presence", "occupancy"].includes(a) ? (r = "Detected", c = "Not detected") : o === "person" || o === "device_tracker" ? (r = "Home", c = "Away") : o === "media_player" ? t.signal_key === "volume" ? (r = "Volume change", c = "No volume change") : t.signal_key === "mute" ? (r = "Mute change", c = "No mute change") : (r = "Playing", c = "Paused/idle") : o === "light" && t.signal_key === "level" ? (r = "Brightness change", c = "No brightness change") : o === "light" && t.signal_key === "color" ? (r = "Color change", c = "No color change") : (o === "light" && t.signal_key === "power" || o === "light" || o === "switch" || o === "fan") && (r = "On", c = "Off"), {
      onState: r,
      offState: c,
      onBehavior: "When activity is detected",
      onTimeout: "Occupied hold time",
      offBehavior: "When activity stops",
      offDelay: "Vacant delay"
    };
  }
  _formatDuration(t) {
    return t === null ? "indefinite" : !t || t <= 0 ? "0m" : `${Math.floor(t / 60)}m`;
  }
  _entityName(t) {
    var e, i;
    return ((i = (e = this.hass.states[t]) == null ? void 0 : e.attributes) == null ? void 0 : i.friendly_name) || t;
  }
  _entityState(t) {
    var i;
    const e = (i = this.hass.states[t]) == null ? void 0 : i.state;
    return e || "unknown";
  }
  async _handleTestSource(t, e) {
    if (!(!this.location || this._isFloorLocation()))
      try {
        if (e === "trigger") {
          const r = (this.location.modules.occupancy || {}).default_timeout || 300, c = t.on_timeout === null ? r : t.on_timeout ?? r, d = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: this._serviceDataWithEntryId({
              location_id: this.location.id,
              source_id: d,
              timeout: c
            })
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: d,
                timeout: c
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${d}`, "success");
          return;
        }
        const i = t.off_trailing ?? 0, n = t.source_id || t.entity_id;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: "clear",
          service_data: this._serviceDataWithEntryId({
            location_id: this.location.id,
            source_id: n,
            trailing_timeout: Math.max(0, i)
          })
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "clear",
              locationId: this.location.id,
              sourceId: n,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        );
        const o = Math.max(0, i);
        o > 0 ? this._showToast(
          `Cleared ${n} with ${this._formatDuration(o)} trailing`,
          "success"
        ) : this._showToast(`Cleared ${n}`, "success");
        const a = this._activeContributorsExcluding(n);
        if (a.length > 0) {
          const r = a.slice(0, 2).join(", "), c = a.length > 2 ? ` +${a.length - 2} more` : "";
          this._showToast(`Still occupied by ${r}${c}`, "error");
        }
      } catch (i) {
        console.error("Failed to test source event:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to run source test", "error");
      }
  }
  _showToast(t, e = "success") {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message: t,
          type: e === "error" ? "error" : void 0
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _updateModuleConfig(t, e) {
    if (this.location)
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/set_module_config",
            location_id: this.location.id,
            module_id: t,
            config: e
          })
        ), this.location.modules[t] = e, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled(t) {
    if (!this.location || this._isFloorLocation()) return;
    const e = this.location.modules.occupancy || {}, i = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: i });
  }
  _withEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _serviceDataWithEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _handleTimeoutSliderInput(t) {
    const e = t.target, i = e.closest(".config-value");
    if (!i) return;
    const n = i.querySelector("input.input");
    n && (n.value = e.value);
  }
  _handleTimeoutChange(t) {
    const e = t.target, i = parseInt(e.value, 10);
    if (Number.isNaN(i)) return;
    const n = Math.max(1, Math.min(120, i));
    e.value = String(n);
    const o = n * 60, a = e.closest(".config-value");
    if (a) {
      const c = a.querySelector("input.timeout-slider");
      c && (c.value = String(n));
      const d = a.querySelector("input.input");
      d && (d.value = String(n));
    }
    if (!this.location || this._isFloorLocation()) return;
    const r = this.location.modules.occupancy || {};
    this._updateConfig({ ...r, default_timeout: o });
  }
  async _updateConfig(t) {
    await this._updateModuleConfig("occupancy", t);
  }
  _isFloorLocation() {
    return !!this.location && U(this.location) === "floor";
  }
};
ye.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  allLocations: { attribute: !1 },
  adjacencyEdges: { attribute: !1 },
  entryId: { attribute: !1 },
  entityRegistryRevision: { type: Number },
  forcedTab: { type: String },
  occupancyStates: { attribute: !1 },
  occupancyTransitions: { attribute: !1 },
  handoffTraces: { attribute: !1 }
}, ye.styles = [
  ke,
  Yt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-main {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        min-width: 0;
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        min-width: 0;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .header-status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .header-vacant-at {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .header-ambient {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-family: var(--code-font-family, monospace);
      }

      .ambient-grid {
        display: grid;
        grid-template-columns: minmax(150px, 220px) 1fr;
        gap: 8px 12px;
        margin-bottom: var(--spacing-md);
      }

      .ambient-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .ambient-value {
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .dusk-status-grid {
        display: grid;
        grid-template-columns: minmax(160px, 220px) 1fr;
        gap: 8px 12px;
      }

      .dusk-status-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .dusk-status-value {
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .dusk-target-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 220px;
        overflow-y: auto;
      }

      .dusk-target-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .dusk-target-row code {
        font-size: 11px;
        color: var(--text-secondary-color);
      }

      .dusk-light-actions {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .dusk-light-action-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px;
        background: var(--card-background-color);
      }

      .dusk-light-action-grid {
        display: grid;
        grid-template-columns:
          26px
          minmax(170px, 260px)
          minmax(240px, 360px)
          minmax(70px, 100px)
          minmax(140px, 200px);
        gap: 8px;
        align-items: center;
      }

      .dusk-light-action-grid.disabled {
        opacity: 0.65;
      }

      .dusk-light-entity-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .dusk-light-entity-meta code {
        font-size: 11px;
        color: var(--text-secondary-color);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dusk-light-action-grid input[type="color"] {
        width: 44px;
        height: 30px;
        padding: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
      }

      .dusk-light-action-grid select {
        width: 100%;
      }

      .dusk-level-control {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .dusk-level-slider {
        width: 100%;
      }

      .dusk-level-value {
        min-width: 38px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .dusk-off-only-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        user-select: none;
      }

      .dusk-off-only-toggle input[type="checkbox"] {
        width: 16px;
        height: 16px;
      }

      .dusk-block-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
      }

      .dusk-block-row {
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        padding: 16px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .dusk-block-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }

      .dusk-block-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .dusk-block-title-button {
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 600;
        padding: 2px 4px;
        cursor: pointer;
        text-align: left;
        border-radius: 6px;
      }

      .dusk-block-title-button:hover {
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .dusk-block-title-input {
        width: min(100%, 380px);
        font-size: 16px;
        font-weight: 600;
      }

      .dusk-rule-row {
        display: grid;
        grid-template-columns: minmax(180px, 230px) minmax(320px, 1fr);
        gap: 12px;
        align-items: center;
        margin-top: 12px;
      }

      .dusk-section-heading {
        margin-top: 18px;
        margin-bottom: 8px;
      }

      .dusk-rule-section-title {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
        color: var(--primary-text-color);
      }

      .dusk-block-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }

      .dusk-delete-rule-button {
        min-width: 112px;
      }

      .dusk-list-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }

      .dusk-conditions {
        margin-top: 14px;
        margin-left: 8px;
        padding-left: 12px;
        border-left: 2px solid rgba(var(--rgb-primary-color), 0.18);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dusk-conditions .config-row {
        grid-template-columns: minmax(220px, 320px) minmax(320px, 1fr);
        padding: 8px 0;
        border-bottom: none;
      }

      .dusk-conditions .config-value {
        width: 100%;
      }

      .dusk-condition-derived {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 500;
      }

      .dusk-condition-derived-note {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 400;
      }

      .dusk-wide-select {
        min-width: 340px;
        width: min(100%, 560px);
        max-width: 560px;
      }

      .dusk-block-grid {
        display: grid;
        grid-template-columns: minmax(120px, 160px) minmax(180px, 1fr);
        gap: 10px;
        align-items: center;
      }

      .dusk-block-grid input[type="time"],
      .dusk-block-grid input[type="number"],
      .dusk-block-grid input[type="text"] {
        width: 100%;
      }

      .dusk-time-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(200px, 260px));
        gap: 12px;
        max-width: 560px;
      }

      .dusk-time-inline {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .dusk-time-inline-fields {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .dusk-time-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 122px;
      }

      .dusk-time-input {
        width: 100%;
        min-height: 36px;
      }

      .dusk-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 10px 0 12px;
      }

      .dusk-save-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 114px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .dusk-save-button.dirty {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: var(--primary-background-color, #fff);
      }

      .dusk-save-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .dusk-inline-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .dusk-inline-actions-end {
        justify-content: flex-end;
        margin-top: 14px;
      }

      .section-title-actions .button,
      .dusk-list-footer .button,
      .dusk-inline-actions-end .button {
        min-width: 108px;
        white-space: nowrap;
      }

      .occupancy-events {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
        max-width: 820px;
      }

      .occupancy-event {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 12px;
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 6px 8px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-event-source {
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .occupancy-event-meta {
        color: var(--text-secondary-color);
        white-space: nowrap;
      }

      .header-meta {
        min-width: 180px;
        display: flex;
        justify-content: flex-end;
      }

      .meta-row {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: 8px;
        margin-top: 4px;
      }

      .meta-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-align: right;
      }

      .meta-value {
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
        color: var(--primary-text-color);
        text-align: right;
      }

      .runtime-summary {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .runtime-summary-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid var(--divider-color);
      }

      .status-chip.occupied {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .status-chip.vacant {
        color: var(--text-secondary-color);
      }

      .status-chip.locked {
        color: var(--warning-color);
        border-color: rgba(var(--rgb-warning-color), 0.35);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .runtime-summary-grid {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 12px;
        max-width: 560px;
      }

      .runtime-summary-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .runtime-summary-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title-row {
        max-width: 900px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
      }

      .section-title-row .section-title {
        margin-bottom: 0;
      }

      .section-title-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .sources-heading {
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .sources-heading .section-title {
        margin-bottom: 0;
      }

      .sources-inline-help {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: var(--spacing-md) 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .startup-config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .startup-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .startup-config-row .config-help {
        margin-top: 0;
        max-width: 700px;
        line-height: 1.45;
      }

      .startup-config-row .config-value {
        flex: 0 0 auto;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .startup-inline {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .startup-inline-toggle {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .startup-inline-help {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .dusk-time-field .input {
        width: 132px;
        min-width: 132px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-row.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.35);
        background: rgba(var(--rgb-primary-color), 0.05);
      }

      .action-device-row {
        grid-template-columns: 28px 24px minmax(0, 1fr) auto;
      }

      .action-include-control {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-include-input {
        appearance: auto;
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .action-include-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.45);
        outline-offset: 2px;
      }

      .action-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      .action-service-select {
        min-width: 170px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .action-dark-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        cursor: pointer;
        user-select: none;
      }

      .action-dark-input {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .service-pill {
        display: inline-flex;
        align-items: center;
        padding: 1px 8px;
        border-radius: 999px;
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
        font-weight: 600;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .action-name-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        flex-wrap: wrap;
      }

      .action-entity-inline {
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .runtime-grid {
        display: grid;
        row-gap: 8px;
        margin-bottom: var(--spacing-md);
      }

      .runtime-row {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        align-items: center;
        column-gap: 12px;
      }

      .runtime-key {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .runtime-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .runtime-note {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .lock-directive-list {
        margin-top: 8px;
        display: grid;
        gap: 6px;
      }

      .lock-directive {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .lock-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(var(--rgb-warning-color), 0.35);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--warning-color);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .source-card-item.grouped {
        border-top: 1px solid var(--divider-color);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .linked-location-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
      }

      .linked-location-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .linked-location-left,
      .linked-location-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .linked-location-left {
        min-width: 0;
      }

      .linked-location-row input[type="checkbox"] {
        margin: 0;
      }

      .linked-location-name {
        font-size: 13px;
        font-weight: 600;
      }

      .linked-location-two-way-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .linked-location-meta {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .advanced-toggle-row {
        display: flex;
        justify-content: flex-end;
        max-width: 820px;
      }

      .adjacency-list {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        max-width: 820px;
      }

      .adjacency-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .adjacency-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .adjacency-neighbor {
        font-size: 13px;
        font-weight: 600;
      }

      .adjacency-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .adjacency-delete-btn {
        font-size: 11px;
        padding: 4px 8px;
      }

      .adjacency-empty {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-bottom: 8px;
      }

      .adjacency-form {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }

      .adjacency-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }

      .adjacency-form-field {
        display: grid;
        gap: 4px;
      }

      .adjacency-form-field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .adjacency-form-field input,
      .adjacency-form-field select {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .adjacency-form-actions {
        display: flex;
        justify-content: flex-end;
      }

      .handoff-trace-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
      }

      .handoff-trace-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .handoff-trace-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
      }

      .handoff-trace-route {
        font-weight: 700;
      }

      .handoff-trace-time {
        color: var(--text-secondary-color);
      }

      .handoff-trace-meta {
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 8px 10px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-entity-inline {
        margin-left: 4px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-submeta {
        margin-top: 6px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 600;
      }

      .light-signal-toggles {
        margin-top: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .light-signal-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--primary-text-color);
      }

      .light-signal-toggle input {
        width: 14px;
        height: 14px;
        accent-color: var(--primary-color);
      }

      .candidate-headline {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .candidate-controls {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .source-state-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--divider-color);
        padding: 2px 8px;
        font-size: 11px;
        color: var(--text-secondary-color);
        text-transform: lowercase;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 8px 10px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-source-section {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--divider-color);
        max-width: 820px;
      }

      .external-source-section .subsection-title {
        margin-bottom: 4px;
      }

      .external-source-section .subsection-help {
        margin-bottom: 10px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .wiab-config {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }

      .wiab-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }

      .wiab-entity-editor {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .wiab-entity-editor label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .wiab-entity-input {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .wiab-entity-input select {
        min-width: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .wiab-chip-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .wiab-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--divider-color);
        border-radius: 999px;
        padding: 2px 8px;
        background: var(--card-background-color);
        font-size: 12px;
      }

      .wiab-chip button {
        border: none;
        background: transparent;
        color: var(--text-secondary-color);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
      }

      .wiab-empty {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-main {
          width: 100%;
        }

        .header-meta {
          width: 100%;
          min-width: 0;
        }

        .meta-label,
        .meta-value {
          text-align: left;
        }

        .runtime-summary-grid {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .startup-config-row {
          gap: 10px;
        }

        .startup-config-header {
          align-items: flex-start;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }

        .dusk-block-grid {
          grid-template-columns: 1fr;
        }

        .dusk-rule-row {
          grid-template-columns: 1fr;
        }

        .dusk-wide-select {
          min-width: 0;
          width: 100%;
          max-width: 100%;
        }

        .dusk-conditions {
          margin-left: 0;
          padding-left: 10px;
        }

        .dusk-conditions .config-row {
          grid-template-columns: 1fr;
        }

        .dusk-time-fields {
          grid-template-columns: 1fr;
          max-width: 100%;
        }

        .dusk-time-inline {
          align-items: flex-start;
          width: 100%;
        }

        .dusk-time-inline-fields {
          width: 100%;
        }

        .dusk-light-action-grid {
          grid-template-columns: 1fr;
        }

        .dusk-toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .section-title-row {
          flex-direction: column;
          align-items: flex-start;
        }

        .section-title-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .sources-heading {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    `
];
let ii = ye;
if (!customElements.get("ht-location-inspector"))
  try {
    customElements.define("ht-location-inspector", ii);
  } catch (s) {
    console.error("[ht-location-inspector] failed to define element", s);
  }
console.log("[ht-location-dialog] module loaded");
var Ki, Vi;
try {
  (Vi = (Ki = import.meta) == null ? void 0 : Ki.hot) == null || Vi.accept(() => window.location.reload());
} catch {
}
const be = class be extends gt {
  constructor() {
    super(...arguments), this.open = !1, this.locations = [], this._config = {
      name: "",
      type: "area"
    }, this._submitting = !1, this._computeLabel = (t) => ({
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Location Icon (optional)"
    })[t.name] || t.name;
  }
  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  willUpdate(t) {
    var e, i, n;
    if (t.has("open")) {
      const o = t.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", o, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((a) => {
        var r, c;
        return `${a.name}(${(c = (r = a.modules) == null ? void 0 : r._meta) == null ? void 0 : c.type})`;
      })), this.open && !o) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const a = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, r = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (n = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : n.icon : void 0;
          this._config = {
            name: this.location.name,
            type: a.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: r || void 0
          };
        } else {
          const a = this.defaultType ?? "area", r = this.defaultParentId;
          this._config = {
            name: "",
            type: a,
            parent_id: r || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(t) {
    super.updated(t), t.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var n, o;
        const e = (n = this.shadowRoot) == null ? void 0 : n.querySelector("ha-form");
        if (e != null && e.shadowRoot) {
          const a = e.shadowRoot.querySelector('input[type="text"]');
          if (a) {
            console.log("[LocationDialog] Focusing input:", a), a.focus(), a.select();
            return;
          }
        }
        const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const t = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), _`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? _`
            <div class="error-message">${this._error}</div>
          ` : ""}

        <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${t}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
        </div>

        <ha-button
          slot="secondaryAction"
          .dialogAction=${"cancel"}
          @click=${this._handleCancel}
          ?disabled=${this._submitting}
        >
          Cancel
        </ha-button>
        <ha-button
          slot="primaryAction"
          .dialogAction=${"confirm"}
          @click=${this._handleSubmit}
          ?disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.location ? "Save" : "Create"}
        </ha-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const t = this._getValidParents(), e = this._includeRootOption(), i = e || t.length > 1;
    console.log("[LocationDialog] parentOptions:", t), this.location;
    const n = [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        // NOTE: "type" is integration metadata (stored in modules._meta), NOT a kernel property.
        // The kernel is type-agnostic. Types are used by the UI to enforce hierarchy rules
        // and map sensible defaults to HA areas.
        name: "type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" },
              { value: "building", label: "Building" },
              { value: "grounds", label: "Grounds" },
              { value: "subarea", label: "Subarea" }
            ]
          }
        }
      }
    ];
    return i && n.push({
      name: "parent_id",
      selector: {
        select: {
          options: [
            ...e ? [{ value: "", label: "(Root Level)" }] : [],
            ...t
          ]
        }
      }
    }), n.push({
      name: "icon",
      selector: { icon: {} }
    }), n;
  }
  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/history/2026.02.24-ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Floors can be root-level or children of Building only
   * - Building/Grounds wrappers are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  _getValidParents() {
    const t = this._config.type, e = Ge(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const n = e.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: n,
      totalLocations: this.locations.length
    }), n.length === 0) return [];
    const o = this._managedShadowLocationIds(), a = this.locations.filter((r) => {
      if (r.is_explicit_root || this._isManagedShadowLocation(r, o)) return !1;
      const c = U(r);
      return n.includes(c);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", a.length, a.map((r) => r.label)), a;
  }
  _isManagedShadowLocation(t, e) {
    return $e(t, e);
  }
  _managedShadowLocationIds() {
    return Se(this.locations);
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = Ge(this._config.type);
    if (t.length === 1 && t[0] === "root") return null;
    const i = String(this._config.parent_id || "").trim();
    if (i) return i;
    const n = this._getValidParents();
    return n.length === 1 ? String(n[0].value) : null;
  }
  _handleValueChanged(t) {
    console.log("[LocationDialog] value-changed received:", t.detail), this._config = { ...this._config, ...t.detail.value }, console.log("[LocationDialog] Updated config:", this._config), this._error = void 0, this.requestUpdate();
  }
  _isValid() {
    return !!this._config.name && !!this._config.type;
  }
  _formatSaveError(t) {
    const e = String((t == null ? void 0 : t.message) || t || "Failed to save location"), i = e.toLowerCase();
    return i.includes("location lifecycle mutations are disabled in this adapter") || i.includes("create/rename/delete floors and areas") ? "Legacy policy error detected. Restart Home Assistant and hard refresh the browser to load updated location create/update support." : e;
  }
  async _handleSubmit() {
    if (console.log("[LocationDialog] Submit clicked, config:", this._config), console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting), !this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }
    this._submitting = !0, this._error = void 0;
    try {
      this.location ? (await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/update",
          location_id: this.location.id,
          changes: {
            name: this._config.name,
            parent_id: this._submitParentId()
          }
        })
      ), await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: "_meta",
          config: {
            type: this._config.type
          }
        })
      )) : await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/create",
          name: this._config.name,
          parent_id: this._submitParentId(),
          meta: {
            type: this._config.type
          }
        })
      ), this.dispatchEvent(new CustomEvent("saved", {
        detail: {
          name: this._config.name,
          type: this._config.type,
          parent_id: this._config.parent_id,
          meta: {
            type: this._config.type
          }
        },
        bubbles: !0,
        composed: !0
      })), this.open = !1;
    } catch (t) {
      console.error("Failed to save location:", t), this._error = this._formatSaveError(t);
    } finally {
      this._submitting = !1;
    }
  }
  _handleCancel() {
    console.log("[LocationDialog] Cancel clicked"), this.open = !1, this._handleClosed();
  }
  _handleClosed() {
    console.log("[LocationDialog] Closed event fired"), this.open = !1, this._error = void 0, this._submitting = !1, this._config = {
      name: "",
      type: "area"
    }, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !1,
      composed: !1
    }));
  }
  _withEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
};
be.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  entryId: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, be.styles = [
  ke,
  Yt`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let ni = be;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", ni);
const ji = "topomation:panel-tree-split", Wi = "topomation:panel-right-mode", He = 0.4, qe = 0.25, Ke = 0.75, sa = "application/x-topomation-entity-id";
var Gi, Yi;
try {
  (Yi = (Gi = import.meta) == null ? void 0 : Gi.hot) == null || Yi.accept(() => window.location.reload());
} catch {
}
const we = class we extends gt {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._occupancyTransitionByLocation = {}, this._adjacencyEdges = [], this._handoffTraceByLocation = {}, this._treePanelSplit = He, this._isResizingPanels = !1, this._entityAreaById = {}, this._entitySearch = "", this._assignBusyByEntityId = {}, this._rightPanelMode = "inspector", this._assignmentFilter = "all", this._deviceGroupExpanded = {}, this._haRegistryRevision = 0, this._hasLoaded = !1, this._loadSeq = 0, this._entityAreaIndexLoaded = !1, this._entityAreaRevision = 0, this._deviceGroupsCache = [], this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleDeviceSearch = (t) => {
      var i;
      const e = ((i = t.target) == null ? void 0 : i.value) ?? "";
      this._entitySearch = e;
    }, this._handleEntityDropped = (t) => {
      var n, o;
      t.stopPropagation();
      const e = (n = t.detail) == null ? void 0 : n.entityId, i = (o = t.detail) == null ? void 0 : o.targetLocationId;
      !e || !i || this._assignEntityToLocation(e, i);
    }, this._handleNewLocation = (t) => {
      t && (t.preventDefault(), t.stopPropagation()), this._editingLocation = void 0, this._newLocationDefaults = {
        parentId: null,
        type: "building"
      }, this._locationDialogOpen = !0;
    }, this._handleDeleteSelected = (t) => {
      t && (t.preventDefault(), t.stopPropagation());
      const e = this._getSelectedLocation();
      if (!e) {
        this._showToast("Select a location to delete", "warning");
        return;
      }
      if (!this._canDeleteLocation(e)) {
        this._showToast(this._deleteDisabledReason(e), "warning");
        return;
      }
      confirm(`Delete "${e.name}"?`) && this._handleLocationDelete(
        new CustomEvent("location-delete", {
          detail: { location: e }
        })
      );
    }, this._handleKeyDown = (t) => {
      (t.ctrlKey || t.metaKey) && t.key === "s" && (t.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (t.ctrlKey || t.metaKey) && t.key === "z" && !t.shiftKey && t.preventDefault(), (t.ctrlKey || t.metaKey) && (t.key === "y" || t.key === "z" && t.shiftKey) && t.preventDefault(), t.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), t.key === "?" && !t.ctrlKey && !t.metaKey && this._showKeyboardShortcutsHelp();
    }, this._handleOpenSidebar = () => {
      this.dispatchEvent(
        new CustomEvent("hass-toggle-menu", {
          bubbles: !0,
          composed: !0,
          detail: { open: !0 }
        })
      );
    }, this._handlePanelSplitterPointerDown = (t) => {
      this._isSplitStackedLayout() || (t.preventDefault(), this._panelResizePointerId = t.pointerId, this._isResizingPanels = !0, this._applyPanelSplitFromClientX(t.clientX), window.addEventListener("pointermove", this._handlePanelSplitterPointerMove), window.addEventListener("pointerup", this._handlePanelSplitterPointerUp), window.addEventListener("pointercancel", this._handlePanelSplitterPointerUp));
    }, this._handlePanelSplitterPointerMove = (t) => {
      this._isResizingPanels && (this._panelResizePointerId !== void 0 && t.pointerId !== this._panelResizePointerId || this._applyPanelSplitFromClientX(t.clientX));
    }, this._handlePanelSplitterPointerUp = (t) => {
      this._isResizingPanels && (this._panelResizePointerId !== void 0 && t.pointerId !== this._panelResizePointerId || (this._applyPanelSplitFromClientX(t.clientX, !0), this._stopPanelSplitterDrag()));
    }, this._handlePanelSplitterKeyDown = (t) => {
      if (this._isSplitStackedLayout()) return;
      const e = t.shiftKey ? 0.08 : 0.03;
      if (t.key === "ArrowLeft") {
        t.preventDefault(), this._setPanelSplit(this._treePanelSplit - e, !0);
        return;
      }
      if (t.key === "ArrowRight") {
        t.preventDefault(), this._setPanelSplit(this._treePanelSplit + e, !0);
        return;
      }
      if (t.key === "Home") {
        t.preventDefault(), this._setPanelSplit(qe, !0);
        return;
      }
      t.key === "End" && (t.preventDefault(), this._setPanelSplit(Ke, !0));
    }, this._handlePanelSplitterReset = () => {
      this._setPanelSplit(He, !0);
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen, this._syncStateChangedSubscription();
    }, this._clearEventLog = () => {
      this._eventLogEntries = [];
    }, this._handleSourceTest = (t) => {
      this._logEvent("ui", "source test", t.detail);
    }, this._toggleEventLogScope = () => {
      this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree", this._logEvent(
        "ui",
        `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
      );
    };
  }
  _enqueueLocationOp(t, e) {
    const n = (this._opQueueByLocationId.get(t) ?? Promise.resolve()).catch(() => {
    }).then(e);
    return this._opQueueByLocationId.set(t, n), n;
  }
  _scheduleReload(t = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(t);
    }, 150);
  }
  willUpdate(t) {
    super.willUpdate(t), !this._hasLoaded && this.hass && (this._hasLoaded = !0, this._loadLocations()), t.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), this._restorePanelSplitPreference(), this._restoreRightPanelModePreference(), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(t) {
    super.updated(t);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._stopPanelSplitterDrag(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._registryRefreshTimer && (clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
  }
  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/history/2026.02.24-frontend-patterns.md Section 1.1
   */
  shouldUpdate(t) {
    for (const e of t.keys())
      if (e !== "hass") return !0;
    if (t.has("hass")) {
      const e = t.get("hass");
      return !e || e.areas !== this.hass.areas;
    }
    return !0;
  }
  render() {
    if (this._loading && !this._locations.length)
      return _`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return _`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const t = this._locations.find(
      (c) => c.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), n = e === "location" ? void 0 : e, o = "Automation", a = this._deleteDisabledReason(t), r = `${(this._treePanelSplit * 100).toFixed(1)}%`;
    return _`
      <div class="panel-container" style=${`--tree-panel-basis: ${r};`}>
        <div class="panel-left">
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${i.title}</div>
            <div class="header-subtitle">
              ${i.subtitle}
            </div>
            <div class="header-actions">
              ${this._isSplitStackedLayout() ? _`
                    <button
                      class="button button-secondary"
                      @click=${this._handleOpenSidebar}
                      aria-label="Open Home Assistant sidebar"
                    >
                      Sidebar
                    </button>
                  ` : ""}
              ${_`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${a}
              >
                Delete Selected
              </button>
              <button class="button button-secondary" @click=${this._toggleEventLog}>
                ${this._eventLogOpen ? "Hide Log" : "Event Log"}
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .version=${this._locationsVersion}
            .selectedId=${this._selectedId}
            .occupancyStates=${this._occupancyStateByLocation}
            .readOnly=${!1}
            .allowMove=${!0}
            .allowRename=${!0}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
            @entity-dropped=${this._handleEntityDropped}
          ></ht-location-tree>
        </div>

        <div
          class="panel-splitter ${this._isResizingPanels ? "dragging" : ""}"
          role="separator"
          aria-label="Resize tree and configuration panels"
          aria-orientation="vertical"
          aria-valuemin=${Math.round(qe * 100)}
          aria-valuemax=${Math.round(Ke * 100)}
          aria-valuenow=${Math.round(this._treePanelSplit * 100)}
          tabindex="0"
          title="Drag to resize panes. Double-click to reset."
          @pointerdown=${this._handlePanelSplitterPointerDown}
          @keydown=${this._handlePanelSplitterKeyDown}
          @dblclick=${this._handlePanelSplitterReset}
        ></div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${o}</div>
            <div class="right-panel-modes" role="tablist" aria-label="Right panel mode">
              <button
                class="button ${this._rightPanelMode === "inspector" ? "button-primary" : "button-secondary"}"
                role="tab"
                aria-selected=${this._rightPanelMode === "inspector"}
                data-testid="right-mode-configure"
                @click=${() => this._handleRightPanelModeChange("inspector")}
              >
                Configure
              </button>
              <button
                class="button ${this._rightPanelMode === "assign" ? "button-primary" : "button-secondary"}"
                role="tab"
                aria-selected=${this._rightPanelMode === "assign"}
                data-testid="right-mode-assign"
                @click=${() => this._handleRightPanelModeChange("assign")}
              >
                Assign Devices
              </button>
            </div>
          </div>
          ${this._rightPanelMode === "assign" ? this._renderDeviceAssignmentPanel(t) : _`
                <ht-location-inspector
                  .hass=${this.hass}
                  .location=${t}
                  .allLocations=${this._locations}
                  .adjacencyEdges=${this._adjacencyEdges}
                  .entryId=${this._activeEntryId()}
                  .entityRegistryRevision=${this._haRegistryRevision}
                  .forcedTab=${n}
                  .occupancyStates=${this._occupancyStateByLocation}
                  .occupancyTransitions=${this._occupancyTransitionByLocation}
                  .handoffTraces=${t ? this._handoffTraceByLocation[t.id] || [] : []}
                  @source-test=${this._handleSourceTest}
                  @adjacency-changed=${this._handleAdjacencyChanged}
                  @location-meta-changed=${this._handleLocationMetaChanged}
                ></ht-location-inspector>
              `}
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _managerViewFromPath(t) {
    return t.startsWith("/topomation-occupancy") ? "occupancy" : t.startsWith("/topomation-appliances") ? "appliances" : t.startsWith("/topomation-media") ? "media" : t.startsWith("/topomation-hvac") ? "hvac" : "location";
  }
  _managerView() {
    var e, i, n;
    const t = (i = (e = this.panel) == null ? void 0 : e.config) == null ? void 0 : i.topomation_view;
    return t === "location" || t === "occupancy" || t === "appliances" || t === "media" || t === "hvac" ? t : (n = this.route) != null && n.path ? this._managerViewFromPath(this.route.path) : this._managerViewFromPath(window.location.pathname || "");
  }
  _managerHeader(t) {
    return {
      title: "Topology",
      subtitle: "Organize buildings, grounds, floors, areas, and subareas, then select a location to configure automation."
    };
  }
  _renderDialogs() {
    var t, e;
    return _`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._parentSelectableLocations()}
        .entryId=${this._activeEntryId()}
        .defaultParentId=${(t = this._newLocationDefaults) == null ? void 0 : t.parentId}
        .defaultType=${(e = this._newLocationDefaults) == null ? void 0 : e.type}
        @dialog-closed=${() => {
      this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>
    `;
  }
  async _ensureEntityAreaIndex(t = !1) {
    var e;
    if ((e = this.hass) != null && e.callWS && !(!t && this._entityAreaIndexLoaded)) {
      if (this._entityAreaIndexPromise) {
        await this._entityAreaIndexPromise;
        return;
      }
      this._entityAreaIndexPromise = (async () => {
        try {
          const [i, n] = await Promise.all([
            this.hass.callWS({ type: "config/entity_registry/list" }),
            this.hass.callWS({ type: "config/device_registry/list" })
          ]), o = /* @__PURE__ */ new Map();
          if (Array.isArray(n))
            for (const l of n) {
              const p = typeof (l == null ? void 0 : l.id) == "string" ? l.id : void 0, f = typeof (l == null ? void 0 : l.area_id) == "string" ? l.area_id : void 0;
              p && f && o.set(p, f);
            }
          const a = {};
          if (Array.isArray(i))
            for (const l of i) {
              const p = typeof (l == null ? void 0 : l.entity_id) == "string" ? l.entity_id : void 0;
              if (!p) continue;
              const f = typeof (l == null ? void 0 : l.area_id) == "string" ? l.area_id : void 0, h = typeof (l == null ? void 0 : l.device_id) == "string" ? o.get(l.device_id) : void 0;
              a[p] = f || h || null;
            }
          const r = this._entityAreaById, c = Object.keys(r), d = Object.keys(a);
          (c.length !== d.length || d.some((l) => r[l] !== a[l])) && (this._entityAreaById = a, this._entityAreaRevision += 1), this._entityAreaIndexLoaded = !0;
        } catch {
        }
      })();
      try {
        await this._entityAreaIndexPromise;
      } finally {
        this._entityAreaIndexPromise = void 0;
      }
    }
  }
  _renderDeviceAssignmentPanel(t) {
    const e = !this._entityAreaIndexLoaded && !!this._entityAreaIndexPromise, i = this._buildDeviceGroups(), n = this._prioritizeDeviceGroupsForSelection(
      this._visibleDeviceGroups(i),
      t == null ? void 0 : t.id
    ), o = this._assignmentFilterStats(i), a = t ? t.name : "Select a location";
    return _`
      <div class="device-assignment-panel">
        <div class="device-panel-head">
          <div class="device-panel-title">Device Assignment</div>
          <div class="device-panel-subtitle">
            Assign target: <strong>${a}</strong>
          </div>
          <input
            class="device-search"
            type="search"
            .value=${this._entitySearch}
            placeholder="Search devices..."
            @input=${this._handleDeviceSearch}
          />
          <div class="device-toolbar">
            <div class="device-filter-group">
              <button
                class="button ${this._assignmentFilter === "all" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("all")}
              >
                All (${o.all})
              </button>
              <button
                class="button ${this._assignmentFilter === "unassigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("unassigned")}
              >
                Unassigned (${o.unassigned})
              </button>
              <button
                class="button ${this._assignmentFilter === "assigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("assigned")}
              >
                Assigned (${o.assigned})
              </button>
            </div>
            <div class="device-group-actions">
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(!0, n)}>
                Expand all
              </button>
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(!1, n)}>
                Collapse all
              </button>
            </div>
          </div>
        </div>
        ${e ? _`<div class="device-empty">Loading area mapping…</div>` : ""}

        ${n.length === 0 ? _`<div class="device-empty">No devices match the current filter.</div>` : n.map((r) => this._renderDeviceGroup(r, t == null ? void 0 : t.id))}
      </div>
    `;
  }
  _renderDeviceGroup(t, e) {
    const i = this._isGroupExpanded(t.key);
    return _`
      <section class="device-group" data-testid=${`device-group-${t.key}`}>
        <button
          class="device-group-header"
          @click=${() => this._toggleDeviceGroup(t.key)}
          aria-expanded=${i}
          aria-label=${`Toggle ${t.label} devices`}
        >
          <span class="device-group-header-left">
            <span class="device-group-chevron">${i ? "▾" : "▸"}</span>
            <span class="device-group-label">${t.label}</span>
          </span>
          <span class="device-group-count">${t.entities.length}</span>
        </button>
        ${i ? t.entities.length === 0 ? _`<div class="device-empty">No devices in this group.</div>` : t.entities.map((n) => {
      const o = !!this._assignBusyByEntityId[n], a = this._entityDisplayName(n);
      return _`
                <div
                  class="device-row"
                  draggable="true"
                  data-entity-id=${n}
                  @dragstart=${(r) => this._handleDeviceDragStart(r, n)}
                >
                  <div>
                    <div class="device-name">${a}</div>
                    <div class="device-meta">${this._deviceMetaForGroup(n, t)}</div>
                  </div>
                  <button
                    class="button button-secondary device-assign-btn"
                    ?disabled=${!e || o}
                    @click=${() => this._handleAssignButton(n, e)}
                  >
                    ${o ? "Assigning..." : "Assign"}
                  </button>
                </div>
              `;
    }) : ""}
      </section>
    `;
  }
  _handleAssignmentFilterChange(t) {
    this._assignmentFilter = t;
  }
  _assignmentFilterStats(t) {
    const e = t.filter((n) => n.type === "unassigned").reduce((n, o) => n + o.entities.length, 0), i = t.filter((n) => n.type !== "unassigned").reduce((n, o) => n + o.entities.length, 0);
    return { all: e + i, unassigned: e, assigned: i };
  }
  _visibleDeviceGroups(t) {
    return this._assignmentFilter === "all" ? t : this._assignmentFilter === "unassigned" ? t.filter((e) => e.type === "unassigned") : t.filter((e) => e.type !== "unassigned");
  }
  _prioritizeDeviceGroupsForSelection(t, e) {
    if (!e || t.length <= 1) return t;
    const i = t.findIndex((o) => o.locationId === e);
    return i <= 0 ? t : [t[i], ...t.slice(0, i), ...t.slice(i + 1)];
  }
  _isGroupExpanded(t) {
    const e = this._deviceGroupExpanded[t];
    return typeof e == "boolean" ? e : t === "unassigned";
  }
  _toggleDeviceGroup(t) {
    const e = this._isGroupExpanded(t);
    this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [t]: !e
    };
  }
  _setAllDeviceGroups(t, e) {
    const i = { ...this._deviceGroupExpanded };
    for (const n of e)
      i[n.key] = t;
    this._deviceGroupExpanded = i;
  }
  _deviceMetaForGroup(t, e) {
    if (e.type !== "unassigned")
      return t;
    const i = this._areaLabel(this._effectiveAreaIdForEntity(t));
    return i === "Unassigned" ? t : `${t} · HA Area: ${i}`;
  }
  _handleDeviceDragStart(t, e) {
    var i, n;
    (i = t.dataTransfer) == null || i.setData(sa, e), (n = t.dataTransfer) == null || n.setData("text/plain", e), t.dataTransfer && (t.dataTransfer.effectAllowed = "move");
  }
  _handleAssignButton(t, e) {
    if (!e) {
      this._showToast("Select a location first", "warning");
      return;
    }
    this._assignEntityToLocation(t, e);
  }
  _allKnownEntityIds() {
    var e;
    const t = /* @__PURE__ */ new Set();
    for (const i of Object.keys(((e = this.hass) == null ? void 0 : e.states) || {})) t.add(i);
    for (const i of Object.keys(this._entityAreaById)) t.add(i);
    for (const i of this._locations)
      for (const n of i.entity_ids || [])
        t.add(n);
    return [...t];
  }
  _entityDisplayName(t) {
    var n, o, a;
    const e = (o = (n = this.hass) == null ? void 0 : n.states) == null ? void 0 : o[t], i = (a = e == null ? void 0 : e.attributes) == null ? void 0 : a.friendly_name;
    return typeof i == "string" && i.trim() ? i : t;
  }
  _effectiveAreaIdForEntity(t) {
    var i, n, o;
    if (Object.prototype.hasOwnProperty.call(this._entityAreaById, t))
      return this._entityAreaById[t];
    const e = ((o = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t]) == null ? void 0 : o.attributes) || {};
    return typeof e.area_id == "string" ? e.area_id : null;
  }
  _areaLabel(t) {
    var e, i, n;
    return t ? ((n = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t]) == null ? void 0 : n.name) || t : "Unassigned";
  }
  _isAssignableEntity(t) {
    var i, n, o;
    const e = ((o = (n = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : n[t]) == null ? void 0 : o.attributes) || {};
    return !((e == null ? void 0 : e.device_class) === "occupancy" && (e != null && e.location_id));
  }
  _groupTypeForLocation(t) {
    const e = U(t);
    return e === "area" ? "area" : e === "subarea" ? "subarea" : e === "floor" ? "floor" : e === "building" ? "building" : e === "grounds" ? "grounds" : "other";
  }
  _buildDeviceGroups() {
    var u;
    const t = this._entitySearch.trim().toLowerCase(), e = Object.keys(((u = this.hass) == null ? void 0 : u.states) || {}).length, i = `${t}|${e}|${this._locationsVersion}|${this._entityAreaRevision}`;
    if (this._deviceGroupsCacheKey === i)
      return this._deviceGroupsCache;
    const n = new Map(this._locations.map((l) => [l.id, l])), o = /* @__PURE__ */ new Map();
    for (const l of this._locations)
      for (const p of l.entity_ids || [])
        p && !o.has(p) && o.set(p, l.id);
    const a = /* @__PURE__ */ new Map(), r = (l, p, f, h) => {
      const g = a.get(l);
      if (g) return g;
      const m = { key: l, label: p, type: f, locationId: h, entities: [] };
      return a.set(l, m), m;
    };
    r("unassigned", "Unassigned", "unassigned");
    for (const l of this._allKnownEntityIds()) {
      if (!this._isAssignableEntity(l)) continue;
      const p = this._entityDisplayName(l), f = o.get(l), h = f ? n.get(f) : void 0, g = this._areaLabel(this._effectiveAreaIdForEntity(l));
      if (t && !`${p} ${l} ${(h == null ? void 0 : h.name) || ""} ${g}`.toLowerCase().includes(t))
        continue;
      if (!h) {
        r("unassigned", "Unassigned", "unassigned").entities.push(l);
        continue;
      }
      const m = this._groupTypeForLocation(h);
      r(
        h.id,
        h.name,
        m,
        h.id
      ).entities.push(l);
    }
    for (const l of a.values())
      l.entities.sort(
        (p, f) => this._entityDisplayName(p).localeCompare(this._entityDisplayName(f))
      );
    const c = {
      unassigned: 0,
      area: 1,
      subarea: 2,
      floor: 3,
      building: 4,
      grounds: 5,
      other: 6
    }, d = [...a.values()].filter((l) => l.entities.length > 0 || l.key === "unassigned").sort((l, p) => {
      const f = c[l.type] - c[p.type];
      return f !== 0 ? f : l.label.localeCompare(p.label);
    });
    return this._deviceGroupsCacheKey = i, this._deviceGroupsCache = d, d;
  }
  _applyEntityAssignmentLocally(t, e) {
    const i = this._locations.map((o) => ({
      ...o,
      entity_ids: (o.entity_ids || []).filter((a) => a !== t)
    })), n = i.find((o) => o.id === e);
    n && !n.entity_ids.includes(t) && (n.entity_ids = [...n.entity_ids, t]), this._locations = i, this._locationsVersion += 1, n && (this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [n.id]: !0
    }), n != null && n.ha_area_id && (this._entityAreaById = { ...this._entityAreaById, [t]: n.ha_area_id }, this._entityAreaRevision += 1);
  }
  async _assignEntityToLocation(t, e) {
    if (!t || !e || this._assignBusyByEntityId[t]) return;
    if (!this._locations.find((o) => o.id === e)) {
      this._showToast("Target location not found", "error");
      return;
    }
    const n = this._locations.map((o) => ({
      ...o,
      entity_ids: [...o.entity_ids || []]
    }));
    this._assignBusyByEntityId = { ...this._assignBusyByEntityId, [t]: !0 }, this._applyEntityAssignmentLocally(t, e);
    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/assign_entity",
          entity_id: t,
          target_location_id: e
        })
      ), await this._loadLocations(!0);
    } catch (o) {
      this._locations = n, this._locationsVersion += 1, console.error("Failed to assign entity:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to assign device", "error");
    } finally {
      const { [t]: o, ...a } = this._assignBusyByEntityId;
      this._assignBusyByEntityId = a;
    }
  }
  async _loadLocations(t = !1) {
    const e = ++this._loadSeq, i = t || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      const o = await Promise.race([
        this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/list"
          })
        ),
        new Promise(
          (d, u) => setTimeout(() => u(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      if (!o || !o.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq)
        return;
      const a = /* @__PURE__ */ new Map();
      for (const d of o.locations) a.set(d.id, d);
      const c = Array.from(a.values()).filter((d) => !d.is_explicit_root);
      this._locations = [...c], this._adjacencyEdges = Array.isArray(o.adjacency_edges) ? [...o.adjacency_edges] : [], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._occupancyTransitionByLocation = this._buildOccupancyTransitionsFromStates(), this._locationsVersion += 1, this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((d) => d.id === this._selectedId) || this._isManagedShadowLocation(this._locations.find((d) => d.id === this._selectedId))) && (this._selectedId = this._preferredSelectedLocationId()), this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
    } catch (n) {
      console.error("Failed to load locations:", n), this._error = n.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (n == null ? void 0 : n.message) || n);
    } finally {
      this._loading = !1;
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(t) {
    this._selectedId = t.detail.locationId;
  }
  _handleAdjacencyChanged() {
    this._loadLocations(!0);
  }
  _handleLocationMetaChanged() {
    this._loadLocations(!0);
  }
  /**
   * Render rename conflict notification banner
   */
  _renderEmptyStateBanner() {
    var i;
    const t = (i = this.hass) == null ? void 0 : i.navigate;
    return _`
      <div class="empty-state-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="empty-state-banner-content">
          <strong>Get started</strong>: Create your first location structure here.
          You can add floors, areas, buildings, grounds, and subareas, then manage hierarchy and occupancy.
        </div>
        <a href="/config/areas" class="button button-primary" @click=${(n) => {
      n.preventDefault(), typeof t == "function" ? t("/config/areas") : window.location.href = "/config/areas";
    }}>
          Open HA Areas/Floors
        </a>
      </div>
    `;
  }
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: t, localName: e, haName: i } = this._renameConflict, n = this._locations.find((o) => o.id === t);
    return _`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(n == null ? void 0 : n.name) || t}" was renamed in Home Assistant to "${i}".
            Your local name is "${e}". Which name should we keep?
          </div>
        </div>
        <div class="conflict-actions">
          <button
            class="button button-text"
            @click=${() => this._handleConflictKeepLocal()}
          >
            Keep Local
          </button>
          <button
            class="button button-primary"
            @click=${() => this._handleConflictAcceptHA()}
          >
            Accept HA
          </button>
          <button
            class="button button-text"
            @click=${() => this._handleConflictDismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    `;
  }
  _handleConflictKeepLocal() {
    this._renameConflict && (this._renameConflict = void 0);
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: t, haName: e } = this._renameConflict, i = this._locations.find((n) => n.id === t);
    i && (i.name = e, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._handleNewLocation();
  }
  _canDeleteLocation(t) {
    return !(!t || t.is_explicit_root);
  }
  _deleteDisabledReason(t) {
    return t ? t.is_explicit_root ? "Home root cannot be deleted" : "Delete selected location" : "Select a location to delete";
  }
  _handleLocationEdit(t) {
    var n;
    t.stopPropagation();
    const e = (n = t == null ? void 0 : t.detail) == null ? void 0 : n.locationId, i = e ? this._locations.find((o) => o.id === e) : this._getSelectedLocation();
    if (!i) {
      this._showToast("Select a location to edit", "warning");
      return;
    }
    this._editingLocation = i, this._newLocationDefaults = void 0, this._locationDialogOpen = !0;
  }
  async _handleLocationMoved(t) {
    t.stopPropagation();
    const { locationId: e, newParentId: i, newIndex: n } = t.detail || {};
    if (!e || typeof n != "number") {
      this._showToast("Invalid move request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/reorder",
            location_id: e,
            new_parent_id: i ?? null,
            new_index: n
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1;
      } catch (o) {
        console.error("Failed to move location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to move location", "error");
      }
    });
  }
  async _handleLocationLockToggle(t) {
    var n, o;
    t.stopPropagation();
    const e = (n = t == null ? void 0 : t.detail) == null ? void 0 : n.locationId, i = !!((o = t == null ? void 0 : t.detail) != null && o.lock);
    if (!e) {
      this._showToast("Invalid lock request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var a;
      try {
        const r = i ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: r,
          service_data: this._serviceDataWithEntryId({
            location_id: e,
            source_id: "manual_ui"
          })
        }), this._logEvent("ui", r, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1;
        const c = ((a = this._locations.find((d) => d.id === e)) == null ? void 0 : a.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${c}"`, "success");
      } catch (r) {
        console.error("Failed to toggle lock:", r), this._showToast((r == null ? void 0 : r.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy" || String(o == null ? void 0 : o.location_id) !== String(t)) continue;
      const a = Array.isArray(o == null ? void 0 : o.locked_by) ? o.locked_by.map((r) => String(r)) : [];
      return {
        isLocked: !!(o != null && o.is_locked),
        lockedBy: a
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  async _handleLocationOccupancyToggle(t) {
    var n, o;
    t.stopPropagation();
    const e = (n = t == null ? void 0 : t.detail) == null ? void 0 : n.locationId, i = !!((o = t == null ? void 0 : t.detail) != null && o.occupied);
    if (!e) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var u, l;
      const a = this._locations.find((p) => p.id === e), r = (a == null ? void 0 : a.name) || e, { isLocked: c, lockedBy: d } = this._getLocationLockState(e);
      if (c) {
        const p = d.length ? ` (${d.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${r}" is locked${p}.`, "warning");
        return;
      }
      try {
        if (!a) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }
        const p = i ? "trigger" : "vacate_area", f = {
          location_id: e,
          source_id: "manual_ui"
        };
        if (i) {
          const h = (l = (u = a.modules) == null ? void 0 : u.occupancy) == null ? void 0 : l.default_timeout;
          typeof h == "number" && h >= 0 && (f.timeout = Math.floor(h));
        } else
          f.include_locked = !1;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: p,
          service_data: this._serviceDataWithEntryId(f)
        }), this._logEvent("ui", p, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${r}" as occupied` : `Marked "${r}" as unoccupied (vacated)`,
          "success"
        );
      } catch (p) {
        console.error("Failed to toggle occupancy:", p), this._showToast((p == null ? void 0 : p.message) || "Hey, can't do it.", "error");
      }
    });
  }
  async _handleLocationRenamed(t) {
    t.stopPropagation();
    const { locationId: e, newName: i } = t.detail || {};
    if (!e || !i) {
      this._showToast("Invalid rename request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/update",
            location_id: e,
            changes: { name: String(i) }
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(`Renamed to "${i}"`, "success");
      } catch (n) {
        console.error("Failed to rename location:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to rename location", "error");
      }
    });
  }
  async _handleLocationDelete(t) {
    var i;
    t.stopPropagation();
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.location;
    if (!(e != null && e.id)) {
      this._showToast("Invalid delete request", "error");
      return;
    }
    if (e.is_explicit_root) {
      this._showToast("Home root cannot be deleted", "warning");
      return;
    }
    await this._enqueueLocationOp(e.id, async () => {
      var n;
      try {
        const o = this._selectedId === e.id, a = e.parent_id ?? void 0;
        if (await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/delete",
            location_id: e.id
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, o) {
          const r = (a && this._locations.some((c) => c.id === a) ? a : (n = this._locations[0]) == null ? void 0 : n.id) ?? void 0;
          this._selectedId = r;
        }
        this._showToast(`Deleted "${e.name}"`, "success");
      } catch (o) {
        console.error("Failed to delete location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to delete location", "error");
      }
    });
  }
  async _handleLocationDialogSaved(t) {
    const e = t.detail, i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${e.name}"` : `Created "${e.name}"`,
        "success"
      );
    } catch (n) {
      console.error("Failed to reload locations:", n), this._showToast(`Failed to reload: ${n.message}`, "error");
    }
  }
  _isSplitStackedLayout() {
    return this.narrow ? !0 : typeof window.matchMedia != "function" ? !1 : window.matchMedia("(max-width: 768px)").matches;
  }
  _clampPanelSplit(t) {
    return Number.isFinite(t) ? Math.min(Ke, Math.max(qe, t)) : He;
  }
  _setPanelSplit(t, e = !1) {
    const i = this._clampPanelSplit(t);
    Math.abs(i - this._treePanelSplit) < 1e-3 || (this._treePanelSplit = i, e && this._persistPanelSplitPreference());
  }
  _restorePanelSplitPreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(ji);
      if (!e) return;
      const i = Number(e);
      this._setPanelSplit(i);
    } catch {
    }
  }
  _persistPanelSplitPreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(ji, this._treePanelSplit.toFixed(4));
    } catch {
    }
  }
  _restoreRightPanelModePreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Wi);
      (e === "assign" || e === "inspector") && (this._rightPanelMode = e);
    } catch {
    }
    this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
  }
  _persistRightPanelModePreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Wi, this._rightPanelMode);
    } catch {
    }
  }
  _handleRightPanelModeChange(t) {
    this._rightPanelMode !== t && (this._rightPanelMode = t, this._persistRightPanelModePreference(), t === "assign" && this._ensureEntityAreaIndex());
  }
  _applyPanelSplitFromClientX(t, e = !1) {
    var a;
    const i = (a = this.shadowRoot) == null ? void 0 : a.querySelector(".panel-container");
    if (!i) return;
    const n = i.getBoundingClientRect();
    if (n.width <= 0) return;
    const o = (t - n.left) / n.width;
    this._setPanelSplit(o, e);
  }
  _stopPanelSplitterDrag() {
    this._isResizingPanels = !1, this._panelResizePointerId = void 0, window.removeEventListener("pointermove", this._handlePanelSplitterPointerMove), window.removeEventListener("pointerup", this._handlePanelSplitterPointerUp), window.removeEventListener("pointercancel", this._handlePanelSplitterPointerUp);
  }
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection) && typeof this.hass.connection.subscribeEvents == "function") {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
      try {
        this._unsubUpdates = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_updated", (t == null ? void 0 : t.data) || {}), this._scheduleReload(!0);
          },
          "topomation_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_updated events", t), this._logEvent("error", "subscribe failed: topomation_updated", String(t));
      }
      try {
        this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var a, r, c, d;
            const e = (a = t == null ? void 0 : t.data) == null ? void 0 : a.location_id, i = (r = t == null ? void 0 : t.data) == null ? void 0 : r.occupied;
            if (!e || typeof i != "boolean") return;
            const n = (c = t == null ? void 0 : t.data) == null ? void 0 : c.previous_occupied, o = typeof ((d = t == null ? void 0 : t.data) == null ? void 0 : d.reason) == "string" && t.data.reason.trim().length ? t.data.reason.trim() : void 0;
            this._setOccupancyState(e, i, {
              previousOccupied: typeof n == "boolean" ? n : void 0,
              reason: o
            }), this._logEvent("ha", "topomation_occupancy_changed", {
              locationId: e,
              occupied: i,
              previousOccupied: typeof n == "boolean" ? n : void 0,
              reason: o
            });
          },
          "topomation_occupancy_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", t), this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(t));
      }
      try {
        this._unsubHandoffTrace = await this.hass.connection.subscribeEvents(
          (t) => {
            const e = (t == null ? void 0 : t.data) || {}, i = typeof e.edge_id == "string" && e.edge_id.trim() ? e.edge_id.trim() : "", n = typeof e.from_location_id == "string" && e.from_location_id.trim() ? e.from_location_id.trim() : "", o = typeof e.to_location_id == "string" && e.to_location_id.trim() ? e.to_location_id.trim() : "";
            if (!i || !n || !o) return;
            const a = {
              edge_id: i,
              from_location_id: n,
              to_location_id: o,
              trigger_entity_id: typeof e.trigger_entity_id == "string" ? e.trigger_entity_id : "",
              trigger_source_id: typeof e.trigger_source_id == "string" ? e.trigger_source_id : "",
              boundary_type: typeof e.boundary_type == "string" ? e.boundary_type : "virtual",
              handoff_window_sec: typeof e.handoff_window_sec == "number" ? e.handoff_window_sec : 12,
              status: typeof e.status == "string" ? e.status : "provisional_triggered",
              timestamp: typeof e.timestamp == "string" && e.timestamp.trim() ? e.timestamp : (/* @__PURE__ */ new Date()).toISOString()
            }, r = (d, u, l) => {
              const p = d[u] || [];
              return {
                ...d,
                [u]: [l, ...p].slice(0, 25)
              };
            };
            let c = r(this._handoffTraceByLocation, n, a);
            c = r(c, o, a), this._handoffTraceByLocation = c, this._logEvent("ha", "topomation_handoff_trace", a);
          },
          "topomation_handoff_trace"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_handoff_trace events", t), this._logEvent("error", "subscribe failed: topomation_handoff_trace", String(t));
      }
      try {
        this._unsubActionsSummary = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_actions_summary", (t == null ? void 0 : t.data) || {});
          },
          "topomation_actions_summary"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_actions_summary events", t), this._logEvent("error", "subscribe failed: topomation_actions_summary", String(t));
      }
      try {
        this._unsubEntityRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("entity_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "entity_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to entity_registry_updated events", t), this._logEvent("error", "subscribe failed: entity_registry_updated", String(t));
      }
      try {
        this._unsubDeviceRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("device_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "device_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to device_registry_updated events", t), this._logEvent("error", "subscribe failed: device_registry_updated", String(t));
      }
      try {
        this._unsubAreaRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("area_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "area_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to area_registry_updated events", t), this._logEvent("error", "subscribe failed: area_registry_updated", String(t));
      }
      await this._syncStateChangedSubscription();
    }
  }
  _scheduleRegistryRefresh(t, e) {
    this._logEvent("ha", t, e), this._registryRefreshTimer && (window.clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._registryRefreshTimer = window.setTimeout(() => {
      this._registryRefreshTimer = void 0, this._haRegistryRevision += 1, this._entityAreaIndexLoaded = !1, this._entityAreaRevision += 1, this._rightPanelMode === "assign" && this._ensureEntityAreaIndex(!0), this._scheduleReload(!0);
    }, 200);
  }
  _setOccupancyState(t, e, i) {
    const n = typeof (i == null ? void 0 : i.reason) == "string" && i.reason.trim().length ? i.reason.trim() : void 0, o = typeof (i == null ? void 0 : i.changedAt) == "string" && i.changedAt.trim().length ? i.changedAt : (/* @__PURE__ */ new Date()).toISOString();
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [t]: e
    }, this._occupancyTransitionByLocation = {
      ...this._occupancyTransitionByLocation,
      [t]: {
        occupied: e,
        previousOccupied: typeof (i == null ? void 0 : i.previousOccupied) == "boolean" ? i.previousOccupied : void 0,
        reason: n,
        changedAt: o
      }
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy") continue;
      const a = o.location_id;
      a && (t[a] = (n == null ? void 0 : n.state) === "on");
    }
    return t;
  }
  _buildOccupancyTransitionsFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const n of Object.values(e)) {
      const o = (n == null ? void 0 : n.attributes) || {};
      if ((o == null ? void 0 : o.device_class) !== "occupancy") continue;
      const a = o.location_id;
      if (!a) continue;
      const r = o.previous_occupied, c = typeof o.reason == "string" && o.reason.trim().length ? o.reason.trim() : void 0, d = typeof (n == null ? void 0 : n.last_changed) == "string" && n.last_changed.trim().length ? n.last_changed : void 0;
      t[a] = {
        occupied: (n == null ? void 0 : n.state) === "on",
        previousOccupied: typeof r == "boolean" ? r : void 0,
        reason: c,
        changedAt: d
      };
    }
    return t;
  }
  async _syncStateChangedSubscription() {
    var t;
    if ((t = this.hass) != null && t.connection && typeof this.hass.connection.subscribeEvents == "function") {
      if (!this._eventLogOpen) {
        this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0);
        return;
      }
      if (!this._unsubStateChanged)
        try {
          this._unsubStateChanged = await this.hass.connection.subscribeEvents(
            (e) => {
              var c, d, u, l, p, f;
              const i = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
              if (!i) return;
              const n = (d = e == null ? void 0 : e.data) == null ? void 0 : d.new_state, o = (n == null ? void 0 : n.attributes) || {};
              if (i.startsWith("binary_sensor.") && o.device_class === "occupancy" && o.location_id && this._setOccupancyState(o.location_id, (n == null ? void 0 : n.state) === "on", {
                previousOccupied: typeof o.previous_occupied == "boolean" ? o.previous_occupied : void 0,
                reason: typeof o.reason == "string" && o.reason.trim().length ? o.reason.trim() : void 0,
                changedAt: typeof (n == null ? void 0 : n.last_changed) == "string" && n.last_changed.trim().length ? n.last_changed : void 0
              }), !this._shouldTrackEntity(i)) return;
              const a = (l = (u = e == null ? void 0 : e.data) == null ? void 0 : u.new_state) == null ? void 0 : l.state, r = (f = (p = e == null ? void 0 : e.data) == null ? void 0 : p.old_state) == null ? void 0 : f.state;
              this._logEvent("ha", "state_changed", { entityId: i, oldState: r, newState: a });
            },
            "state_changed"
          );
        } catch (e) {
          console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
        }
    }
  }
  _renderEventLog() {
    return _`
      <div class="event-log">
        <div class="event-log-header">
          <span>
            Runtime Event Log (${this._eventLogEntries.length})
            <span class="event-log-meta">• ${this._getEventLogScopeLabel()}</span>
          </span>
          <div class="event-log-header-actions">
            <button class="button button-secondary" @click=${this._toggleEventLogScope}>
              ${this._eventLogScope === "subtree" ? "All locations" : "Selected subtree"}
            </button>
            <button class="button button-secondary" @click=${this._clearEventLog}>Clear</button>
          </div>
        </div>
        <div class="event-log-list">
          ${this._eventLogEntries.length === 0 ? _`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (t) => _`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${t.ts}] ${t.type}</div>
                    <div>${t.message}</div>
                    ${t.data !== void 0 ? _`<div class="event-log-meta">${this._safeStringify(t.data)}</div>` : ""}
                  </div>
                `
    )}
        </div>
      </div>
    `;
  }
  _shouldTrackEntity(t) {
    return this._eventLogScope === "all" ? this._isTrackedEntity(t) : this._isTrackedEntityInSelectedSubtree(t);
  }
  _isTrackedEntity(t) {
    var i, n;
    const e = /* @__PURE__ */ new Set();
    for (const o of this._locations) {
      for (const r of o.entity_ids || []) e.add(r);
      const a = ((n = (i = o.modules) == null ? void 0 : i.occupancy) == null ? void 0 : n.occupancy_sources) || [];
      for (const r of a) e.add(r.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, n;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const o of this._locations) {
      if (!e.has(o.id)) continue;
      if ((o.entity_ids || []).includes(t) || (((n = (i = o.modules) == null ? void 0 : i.occupancy) == null ? void 0 : n.occupancy_sources) || []).some((r) => r.entity_id === t)) return !0;
    }
    return !1;
  }
  _getSelectedSubtreeLocationIds() {
    const t = /* @__PURE__ */ new Set();
    if (!this._selectedId) return t;
    t.add(this._selectedId);
    let e = !0;
    for (; e; ) {
      e = !1;
      for (const i of this._locations)
        i.parent_id && t.has(i.parent_id) && !t.has(i.id) && (t.add(i.id), e = !0);
    }
    return t;
  }
  _getEventLogScopeLabel() {
    if (this._eventLogScope === "all") return "all locations";
    const t = this._locations.find((i) => i.id === this._selectedId);
    if (!t) return "selected subtree";
    const e = this._getSelectedSubtreeLocationIds().size;
    return `${t.name} subtree (${e} locations)`;
  }
  _safeStringify(t) {
    try {
      return JSON.stringify(t);
    } catch {
      return String(t);
    }
  }
  _logEvent(t, e, i) {
    const n = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: t,
      message: e,
      data: i
    };
    this._eventLogEntries = [n, ...this._eventLogEntries].slice(0, 200);
  }
  _showKeyboardShortcutsHelp() {
    const e = [
      { key: "Drag", description: "Move location in hierarchy (tree handle)" },
      { key: "Left/Right", description: "Resize panes when splitter is focused" },
      { key: "?", description: "Show this help" }
    ].map((i) => `${i.key}: ${i.description}`).join(`
`);
    alert(`Keyboard Shortcuts:

${e}`);
  }
  _getSelectedLocation() {
    if (this._selectedId)
      return this._locations.find((t) => t.id === this._selectedId);
  }
  /**
   * Batch save all pending changes
   * See: docs/history/2026.02.24-frontend-patterns.md Section 13.2
   */
  async _handleSaveChanges() {
    if (this._pendingChanges.size === 0 || this._saving) return;
    this._saving = !0;
    const t = Array.from(this._pendingChanges.entries()), e = await Promise.allSettled(
      t.map(([n, o]) => this._saveChange(n, o))
    ), i = e.filter((n) => n.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([n, o], a) => {
      e[a].status === "fulfilled" && this._pendingChanges.delete(n);
    })) : this._showToast("Failed to save changes", "error"), this._saving = !1, await this._loadLocations();
  }
  /**
   * Discard all pending changes and reload from server.
   */
  async _handleDiscardChanges() {
    this._pendingChanges.size === 0 || this._discarding || (this._discarding = !0, this._pendingChanges.clear(), await this._loadLocations(!0), this._discarding = !1);
  }
  async _saveChange(t, e) {
    switch (e.type) {
      case "update":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/update",
          location_id: t,
          changes: e.updated
        }));
        break;
      case "delete":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/delete",
          location_id: t
        }));
        break;
      case "create":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/create",
          ...e.updated
        }));
        break;
    }
  }
  _activeEntryId() {
    var n, o, a, r;
    const t = (o = (n = this.panel) == null ? void 0 : n.config) == null ? void 0 : o.entry_id;
    if (typeof t == "string" && t.trim()) {
      const c = t.trim();
      return this._lastKnownEntryId = c, c;
    }
    const e = (r = (a = this.route) == null ? void 0 : a.path) == null ? void 0 : r.split("?", 2)[1];
    if (e) {
      const c = new URLSearchParams(e).get("entry_id");
      if (c && c.trim()) {
        const d = c.trim();
        return this._lastKnownEntryId = d, d;
      }
    }
    const i = new URLSearchParams(window.location.search).get("entry_id");
    if (i && i.trim()) {
      const c = i.trim();
      return this._lastKnownEntryId = c, c;
    }
    return this._lastKnownEntryId;
  }
  _withEntryId(t) {
    const e = this._activeEntryId();
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _serviceDataWithEntryId(t) {
    const e = this._activeEntryId();
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _showToast(t, e = "success") {
    const i = new CustomEvent("hass-notification", {
      detail: {
        message: t,
        type: e === "error" ? "error" : void 0,
        duration: e === "error" ? 5e3 : 3e3
      },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i);
  }
  async _seedDemoData() {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }
  _isManagedShadowLocation(t) {
    return t ? $e(t, this._managedShadowLocationIds()) : !1;
  }
  _managedShadowLocationIds() {
    return Se(this._locations);
  }
  _parentSelectableLocations() {
    return this._locations.filter((t) => !this._isManagedShadowLocation(t));
  }
  _preferredSelectedLocationId() {
    var t;
    return (t = this._locations.find((e) => !this._isManagedShadowLocation(e))) == null ? void 0 : t.id;
  }
};
we.properties = {
  hass: { attribute: !1 },
  narrow: { attribute: !1 },
  panel: { attribute: !1 },
  route: { attribute: !1 },
  // Internal state
  _locations: { state: !0 },
  _locationsVersion: { state: !0 },
  _selectedId: { state: !0 },
  _loading: { state: !0 },
  _error: { state: !0 },
  _pendingChanges: { state: !0 },
  _saving: { state: !0 },
  _discarding: { state: !0 },
  _locationDialogOpen: { state: !0 },
  _editingLocation: { state: !0 },
  _renameConflict: { state: !0 },
  _newLocationDefaults: { state: !0 },
  _eventLogOpen: { state: !0 },
  _eventLogEntries: { state: !0 },
  _occupancyStateByLocation: { state: !0 },
  _occupancyTransitionByLocation: { state: !0 },
  _adjacencyEdges: { state: !0 },
  _handoffTraceByLocation: { state: !0 },
  _treePanelSplit: { state: !0 },
  _isResizingPanels: { state: !0 },
  _entityAreaById: { state: !0 },
  _entitySearch: { state: !0 },
  _assignBusyByEntityId: { state: !0 },
  _rightPanelMode: { state: !0 },
  _assignmentFilter: { state: !0 },
  _deviceGroupExpanded: { state: !0 },
  _haRegistryRevision: { state: !0 }
}, we.styles = [
  ke,
  Yt`
      :host {
        display: block;
        height: 100%;
        min-height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        --tree-panel-basis: 40%;
        display: flex;
        height: 100%;
        min-width: 0;
      }

      /* Tree Panel defaults to ~40%, now user-resizable via splitter */
      .panel-left {
        flex: 0 0 var(--tree-panel-basis);
        min-width: 300px;
        max-width: calc(100% - 410px);
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .panel-splitter {
        flex: 0 0 10px;
        position: relative;
        cursor: col-resize;
        touch-action: none;
        user-select: none;
      }

      .panel-splitter::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 4px;
        width: 2px;
        background: var(--divider-color);
        transition: background-color 0.15s ease;
      }

      .panel-splitter:hover::before,
      .panel-splitter.dragging::before,
      .panel-splitter:focus-visible::before {
        background: var(--primary-color);
      }

      .panel-splitter:focus-visible {
        outline: none;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          min-width: 280px;
          max-width: calc(100% - 310px);
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        :host {
          height: auto;
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .panel-container {
          flex-direction: column;
          height: auto;
        }

        .panel-left,
        .panel-right {
          flex: 0 0 auto;
          min-width: unset;
          max-width: unset;
          overflow: visible;
        }

        .panel-splitter {
          display: none;
        }

        ht-location-tree {
          flex: 0 0 auto;
          min-height: 200px;
          max-height: 52vh;
        }
      }

      /* Header styling - from docs/history/2026.02.24-ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
        margin-bottom: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .right-panel-modes {
        margin-top: var(--spacing-sm);
        display: flex;
        gap: 8px;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      ht-location-tree {
        flex: 1 1 auto;
        min-height: 0;
      }

      ht-location-inspector {
        flex: 1 1 auto;
        min-height: 0;
      }

      .device-assignment-panel {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 0 var(--spacing-md) var(--spacing-md);
      }

      .device-panel-head {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--card-background-color);
        padding: var(--spacing-md) 0 var(--spacing-sm);
      }

      .device-panel-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .device-panel-subtitle {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-search {
        width: 100%;
        margin-top: var(--spacing-sm);
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .device-toolbar {
        margin-top: var(--spacing-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-chip {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
      }

      .device-group-actions {
        display: flex;
        gap: 6px;
      }

      .device-group {
        margin-top: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
      }

      .device-group-header {
        width: 100%;
        border: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.06);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        cursor: pointer;
        color: var(--primary-text-color);
        text-align: left;
      }

      .device-group-header:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }

      .device-group-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .device-group-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-group-chevron {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-group-count {
        color: var(--text-secondary-color);
        font-weight: 600;
        font-size: 11px;
      }

      .device-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 8px 10px;
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        background: var(--card-background-color);
      }

      .device-row[draggable="true"] {
        cursor: grab;
      }

      .device-row[draggable="true"]:active {
        cursor: grabbing;
      }

      .device-name {
        font-size: 13px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-assign-btn {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .device-empty {
        padding: 14px 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      /* Loading and error states */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
        text-align: center;
      }

      .error-container h3 {
        margin-bottom: var(--spacing-md);
      }

      .error-container p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary-color);
      }

      /* Rename conflict notification */
      .conflict-banner {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-theme="dark"] .conflict-banner {
        background: #4a3f1f;
        border-left-color: #ffc107;
      }

      .conflict-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .conflict-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #856404;
      }

      [data-theme="dark"] .conflict-title {
        color: #ffc107;
      }

      .conflict-message {
        color: #856404;
      }

      [data-theme="dark"] .conflict-message {
        color: #ddd;
      }

      .conflict-actions {
        display: flex;
        gap: 8px;
      }

      .conflict-actions button {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .empty-state-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
        border-left: 4px solid var(--primary-color);
        border-radius: 0 4px 4px 0;
      }

      .empty-state-banner ha-icon {
        flex-shrink: 0;
        color: var(--primary-color);
      }

      .empty-state-banner-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--primary-text-color);
      }

      .empty-state-banner .button {
        flex-shrink: 0;
        text-decoration: none;
      }

      .event-log {
        margin: 0 var(--spacing-md) var(--spacing-md);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
        overflow: hidden;
      }

      .event-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color);
        font-size: 12px;
        font-weight: 600;
      }

      .event-log-list {
        max-height: 220px;
        overflow: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 11px;
      }

      .event-log-item {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        line-height: 1.35;
      }

      .event-log-item:last-child {
        border-bottom: none;
      }

      .event-log-meta {
        color: var(--text-secondary-color);
      }

      .event-log-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `
];
let oi = we;
if (!customElements.get("topomation-panel"))
  try {
    customElements.define("topomation-panel", oi);
  } catch (s) {
    console.error("[topomation-panel] failed to define element", s);
  }
export {
  oi as TopomationPanel
};
