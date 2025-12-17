import { ContainerModule } from "inversify";
import { WidgetFactory, FrontendApplicationContribution } from "@theia/core/lib/browser";
import { CofounderWidget } from "./cofounder-widget";

export default new ContainerModule((bind) => {
	bind(CofounderWidget).toSelf().inSingletonScope();
	bind(WidgetFactory)
		.toDynamicValue((ctx) => ({
			id: CofounderWidget.ID,
			createWidget: () => ctx.container.get<CofounderWidget>(CofounderWidget),
		}))
		.inSingletonScope();

	bind(FrontendApplicationContribution).toDynamicValue((ctx) => {
		const widget = ctx.container.get<CofounderWidget>(CofounderWidget);
		return widget;
	});
});
