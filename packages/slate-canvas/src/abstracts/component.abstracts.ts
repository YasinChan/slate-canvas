import { PluginProviders } from "@/types";

export default abstract class ComponentBase {
  public abstract readonly type: string;

  public abstract initialize(providers: PluginProviders): Promise<void> | void;
}
