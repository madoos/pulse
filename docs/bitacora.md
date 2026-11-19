# Bitácora

Registro cronológico de las decisiones de diseño de Pulse y del porqué de cada una. Las decisiones formales se recogen además como ADR en [`adr/`](adr/README.md).

---

## 2026-11-19 — Arranque del proyecto

Todo diseño empieza por conocer y entender bien los casos de uso. Para los tests de aceptación he elegido Gherkin porque se pueden automatizar más adelante: así puedo automatizar los casos de uso más importantes y tener una red de seguridad.

Todo proyecto empieza también con una convención de commits, para que todos se escriban de la misma forma y el changelog se genere solo, y con un CI inicial que nos acompañe hasta que la arquitectura y el stack estén más definidos. La idea es tener una base pequeñita pero consistente sobre la que empezar a desarrollar la arquitectura.

En esta primera parte tenemos:

- Los [tests de aceptación](../acceptance-test/), es decir, los tests de usuario de los que se derivará absolutamente todo.
- Un [ADR](adr/0001-use-conventional-commits.md) que establece que el proyecto usa una convención de commits para automatizar el changelog.
- El setup inicial del CI, que valida esos commits y pone en marcha release-please. Con él entramos desde el principio en el ciclo de vida de la aplicación, para que la release esté lista cuando la queramos.
- Por otro lado, me gusta diseñar el arnés alrededor de los ADR. Así el proyecto es consistente y no hacen falta ficheros específicos para agentes: el [`CLAUDE.md`](../CLAUDE.md) solo pide seguir los ADR y, como están [indexados](adr/README.md), el agente los va descubriendo de forma progresiva a medida que los necesita.
