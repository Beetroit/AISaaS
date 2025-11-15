import importlib
import inspect
import pkgutil
from typing import Dict, Type

from backend.app.services.workflow_actions.base import BaseAction


class ActionFactory:
    """
    A factory to discover, register, and retrieve workflow action classes.

    This factory dynamically imports all modules in the 'workflow_actions'
    package, finds all subclasses of BaseAction, and registers them in a
    dictionary, mapping their 'type' attribute to the class itself.
    """

    _actions: Dict[str, Type[BaseAction]] = {}

    @classmethod
    def discover_actions(cls):
        """Dynamically discovers and registers actions."""
        if cls._actions:
            return

        import backend.app.services.workflow_actions as actions_package

        for _, name, _ in pkgutil.iter_modules(actions_package.__path__):
            module = importlib.import_module(f"{actions_package.__name__}.{name}")
            for _, obj in inspect.getmembers(module, inspect.isclass):
                if issubclass(obj, BaseAction) and obj is not BaseAction:
                    if hasattr(obj, "type"):
                        cls._actions[obj.type] = obj
                    else:
                        # This would indicate a developer error in a new action class
                        print(
                            f"Warning: Action class {obj.__name__} is missing a 'type' attribute."
                        )

    @classmethod
    def get_action(cls, action_type: str) -> Type[BaseAction]:
        """
        Retrieves a registered action class by its type.

        Raises:
            ValueError: If the action_type is not found.
        """
        cls.discover_actions()
        action = cls._actions.get(action_type)
        if not action:
            raise ValueError(f"Action type '{action_type}' not found.")
        return action

    @classmethod
    def get_all_actions(cls) -> Dict[str, Type[BaseAction]]:
        """Returns a dictionary of all registered action classes."""
        cls.discover_actions()
        return cls._actions


# Initialize the factory by discovering actions on startup
ActionFactory.discover_actions()
